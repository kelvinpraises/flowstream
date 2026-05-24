"""
FlowStream CV Detector — real-time football observation via Roboflow models.

Processes a video source (file, RTSP, HLS) frame-by-frame using:
  - YOLOv8 player detection + ByteTrack tracking
  - YOLOv8 ball detection + BallTracker smoothing
  - YOLOv8 pitch keypoint detection + ViewTransformer (camera → pitch coords)
  - Team classification via jersey color clustering

Outputs one JSON line per frame to stdout. The FootballAdapter in
sdk-stats reads these lines and maps them to ObservationFrames.

Usage:
  python detector.py --source video.mp4 --fps 5
  python detector.py --source rtsp://camera.local/stream --fps 10

Requirements:
  pip install -r requirements.txt

Model weights (place in cv/data/):
  - football-player-detection.pt
  - football-pitch-detection.pt
  - football-ball-detection.pt
"""

import argparse
import json
import sys
import time
import os
from pathlib import Path

try:
    import cv2
    import numpy as np
    import supervision as sv
    from ultralytics import YOLO
except ImportError as e:
    print(json.dumps({
        "error": f"Missing dependency: {e}. Install: pip install -r requirements.txt"
    }), flush=True)
    sys.exit(1)

# Resolve model paths relative to this script
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
PLAYER_MODEL_PATH = DATA_DIR / "football-player-detection.pt"
PITCH_MODEL_PATH = DATA_DIR / "football-pitch-detection.pt"
BALL_MODEL_PATH = DATA_DIR / "football-ball-detection.pt"

# Import roboflow sports utilities
ROBOFLOW_PATH = SCRIPT_DIR.parent.parent.parent.parent / "context" / "roboflow-sports"
sys.path.insert(0, str(ROBOFLOW_PATH))

from sports.common.ball import BallTracker
from sports.common.view import ViewTransformer
from sports.common.team import TeamClassifier
from sports.configs.soccer import SoccerPitchConfiguration

CONFIG = SoccerPitchConfiguration()
PLAYER_CLASS_ID = 2
GOALKEEPER_CLASS_ID = 1
BALL_CLASS_ID = 0
REFEREE_CLASS_ID = 3


def run(source: str, fps: float):
    """Real CV pipeline using Roboflow YOLO models."""

    for p in [PLAYER_MODEL_PATH, PITCH_MODEL_PATH, BALL_MODEL_PATH]:
        if not p.exists():
            print(json.dumps({
                "error": f"Model not found: {p}. Download from Roboflow and place in {DATA_DIR}/"
            }), flush=True)
            sys.exit(1)

    # Load models
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    player_model = YOLO(str(PLAYER_MODEL_PATH)).to(device=device)
    pitch_model = YOLO(str(PITCH_MODEL_PATH)).to(device=device)
    ball_model = YOLO(str(BALL_MODEL_PATH)).to(device=device)

    # Initialize trackers
    ball_tracker = BallTracker(buffer_size=20)
    player_tracker = sv.ByteTrack(minimum_consecutive_frames=3)

    # Ball slicer for small object detection
    def ball_callback(image_slice: np.ndarray) -> sv.Detections:
        result = ball_model(image_slice, imgsz=640, verbose=False)[0]
        return sv.Detections.from_ultralytics(result)

    slicer = sv.InferenceSlicer(
        callback=ball_callback,
        overlap_filter_strategy=sv.OverlapFilter.NONE,
        slice_wh=(640, 640),
    )

    # Team classifier — collect initial crops from first pass
    print(json.dumps({"status": "calibrating", "message": "Collecting player crops for team classification..."}), flush=True)
    frame_gen_init = sv.get_video_frames_generator(source_path=source, stride=60)
    crops = []
    for frame in frame_gen_init:
        result = player_model(frame, imgsz=1280, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(result)
        players = detections[detections.class_id == PLAYER_CLASS_ID]
        crops += [sv.crop_image(frame, xyxy) for xyxy in players.xyxy]
        if len(crops) >= 100:
            break

    team_classifier = TeamClassifier(device=device)
    if crops:
        team_classifier.fit(crops)

    print(json.dumps({"status": "ready", "message": f"Team classifier trained on {len(crops)} crops. Starting detection."}), flush=True)

    # Main frame loop
    frame_gen = sv.get_video_frames_generator(source_path=source)
    frame_interval = 1.0 / fps
    frame_id = 0
    score = [0, 0]
    period = 1
    start_time = time.time()
    last_emit = 0

    for frame in frame_gen:
        now = time.time()
        if now - last_emit < frame_interval:
            continue
        last_emit = now

        elapsed_ms = (now - start_time) * 1000
        game_min = elapsed_ms / 1000 / 60

        # --- Pitch keypoints ---
        pitch_result = pitch_model(frame, verbose=False)[0]
        keypoints = sv.KeyPoints.from_ultralytics(pitch_result)
        mask = (keypoints.xy[0][:, 0] > 1) & (keypoints.xy[0][:, 1] > 1)

        # --- Player detection + tracking ---
        player_result = player_model(frame, imgsz=1280, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(player_result)
        detections = player_tracker.update_with_detections(detections)

        players = detections[detections.class_id == PLAYER_CLASS_ID]
        player_crops = [sv.crop_image(frame, xyxy) for xyxy in players.xyxy]
        players_team_id = team_classifier.predict(player_crops) if player_crops else np.array([])

        # --- Ball detection ---
        ball_detections = slicer(frame).with_nms(threshold=0.1)
        ball_detections = ball_tracker.update(ball_detections)

        ball_pos = None
        transformer = None

        # Build view transformer if enough keypoints
        if mask.sum() >= 4:
            try:
                transformer = ViewTransformer(
                    source=keypoints.xy[0][mask].astype(np.float32),
                    target=np.array(CONFIG.vertices)[mask].astype(np.float32)
                )
            except Exception:
                transformer = None

        if len(ball_detections) > 0:
            ball_xy = ball_detections.get_anchors_coordinates(sv.Position.CENTER)[0]
            if transformer:
                try:
                    transformed = transformer.transform_points(
                        ball_xy.reshape(1, 2).astype(np.float32)
                    )
                    bx = float(np.clip(transformed[0][0] / CONFIG.length, 0, 1))
                    by = float(np.clip(transformed[0][1] / CONFIG.width, 0, 1))
                    ball_pos = [round(bx, 4), round(by, 4)]
                except Exception:
                    h, w = frame.shape[:2]
                    ball_pos = [round(float(ball_xy[0] / w), 4), round(float(ball_xy[1] / h), 4)]
            else:
                h, w = frame.shape[:2]
                ball_pos = [round(float(ball_xy[0] / w), 4), round(float(ball_xy[1] / h), 4)]

        # Possession from ball x position
        possession = int(ball_pos[0] * 100) if ball_pos else 50

        # Player positions (transformed to pitch coords)
        player_data = None
        if len(players) > 0 and transformer:
            try:
                player_xy = players.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
                transformed_players = transformer.transform_points(player_xy.astype(np.float32))
                player_data = [
                    {
                        "x": round(float(p[0] / CONFIG.length), 4),
                        "y": round(float(p[1] / CONFIG.width), 4),
                        "team": int(players_team_id[i]) if i < len(players_team_id) else -1,
                        "id": int(players.tracker_id[i]) if players.tracker_id is not None and i < len(players.tracker_id) else -1,
                    }
                    for i, p in enumerate(transformed_players)
                ]
            except Exception:
                pass

        events = []

        output = {
            "ts": int(now * 1000),
            "ball": ball_pos,
            "score": score,
            "min": round(game_min, 1),
            "period": period,
            "possession": possession,
            "events": events,
            "players": player_data,
            "formations": None,
        }

        print(json.dumps(output), flush=True)
        frame_id += 1

    print(json.dumps({"status": "done", "frames": frame_id}), flush=True)


def main():
    parser = argparse.ArgumentParser(description="FlowStream CV Detector")
    parser.add_argument("--source", required=True, help="Video source: file path, RTSP URL, or HLS URL")
    parser.add_argument("--fps", type=float, default=5, help="Frames per second to emit")
    args = parser.parse_args()
    run(args.source, args.fps)


if __name__ == "__main__":
    main()
