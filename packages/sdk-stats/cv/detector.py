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
  python detector.py --source mock --fps 5  # synthetic data for testing

Requirements:
  pip install ultralytics supervision opencv-python numpy

Model weights (place in cv/data/):
  - football-player-detection.pt
  - football-pitch-detection.pt
  - football-ball-detection.pt
"""

import argparse
import json
import sys
import time
import math
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Check if running in mock mode (no CV dependencies needed)
# ---------------------------------------------------------------------------

def run_mock(fps: float):
    """Synthetic football data — no CV models needed. For testing the pipeline."""
    frame_id = 0
    score = [0, 0]
    period = 1
    start = time.time()

    while True:
        elapsed = time.time() - start
        game_min = elapsed * 3  # 3x speed: 1 real second = 3 game seconds

        # Synthetic ball position (normalized 0-1 on pitch)
        bx = 0.5 + 0.4 * math.sin(elapsed * 0.3) * math.cos(elapsed * 0.17)
        by = 0.5 + 0.3 * math.cos(elapsed * 0.23) * math.sin(elapsed * 0.11)

        # Possession based on ball x position
        possession = max(10, min(90, int(bx * 100)))

        # Goal every ~90 seconds
        events = []
        if frame_id > 0 and frame_id % int(90 * fps) == 0:
            side = 0 if bx > 0.5 else 1
            score[side] += 1
            events.append({
                "type": "score_change",
                "side": side,
                "at": game_min,
            })

        # Period change at ~45 min game time
        if game_min > 45 * 60 and period == 1:
            period = 2
            events.append({
                "type": "phase_change",
                "side": 0,
                "at": game_min,
                "data": {"period": 2},
            })

        frame = {
            "ts": int(time.time() * 1000),
            "ball": [round(bx, 4), round(by, 4)],
            "score": score,
            "min": round(game_min / 60, 1),
            "period": period,
            "possession": possession,
            "events": events,
            "players": None,
            "formations": None,
        }

        print(json.dumps(frame), flush=True)
        frame_id += 1
        time.sleep(1.0 / fps)


def run_cv(source: str, fps: float):
    """Real CV pipeline using Roboflow YOLO models."""
    try:
        import cv2
        import numpy as np
        import supervision as sv
        from ultralytics import YOLO
    except ImportError as e:
        print(json.dumps({
            "error": f"Missing dependency: {e}. Install: pip install ultralytics supervision opencv-python"
        }), flush=True)
        sys.exit(1)

    # Resolve model paths relative to this script
    script_dir = Path(__file__).parent
    data_dir = script_dir / "data"

    player_model_path = data_dir / "football-player-detection.pt"
    pitch_model_path = data_dir / "football-pitch-detection.pt"
    ball_model_path = data_dir / "football-ball-detection.pt"

    for p in [player_model_path, pitch_model_path, ball_model_path]:
        if not p.exists():
            print(json.dumps({
                "error": f"Model not found: {p}. Download from Roboflow and place in {data_dir}/"
            }), flush=True)
            sys.exit(1)

    # Load models
    device = "cuda" if __import__("torch").cuda.is_available() else "cpu"
    player_model = YOLO(str(player_model_path)).to(device=device)
    pitch_model = YOLO(str(pitch_model_path)).to(device=device)
    ball_model = YOLO(str(ball_model_path)).to(device=device)

    # Import roboflow sports utilities
    sys.path.insert(0, str(script_dir.parent.parent.parent.parent / "context" / "roboflow-sports"))
    from sports.common.ball import BallTracker
    from sports.common.view import ViewTransformer
    from sports.common.team import TeamClassifier
    from sports.configs.soccer import SoccerPitchConfiguration

    CONFIG = SoccerPitchConfiguration()
    PLAYER_CLASS_ID = 2
    GOALKEEPER_CLASS_ID = 1
    BALL_CLASS_ID = 0
    REFEREE_CLASS_ID = 3

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

    # Team classifier — collect initial crops
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
        game_min = elapsed_ms / 1000 * 3 / 60  # 3x speed

        # --- Pitch keypoints ---
        pitch_result = pitch_model(frame, verbose=False)[0]
        keypoints = sv.KeyPoints.from_ultralytics(pitch_result)

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
        if len(ball_detections) > 0:
            ball_xy = ball_detections.get_anchors_coordinates(sv.Position.CENTER)[0]
            # Transform to pitch coordinates if keypoints available
            mask = (keypoints.xy[0][:, 0] > 1) & (keypoints.xy[0][:, 1] > 1)
            if mask.sum() >= 4:
                try:
                    transformer = ViewTransformer(
                        source=keypoints.xy[0][mask].astype(np.float32),
                        target=np.array(CONFIG.vertices)[mask].astype(np.float32)
                    )
                    transformed = transformer.transform_points(
                        ball_xy.reshape(1, 2).astype(np.float32)
                    )
                    # Normalize to 0-1 range
                    bx = float(np.clip(transformed[0][0] / CONFIG.length, 0, 1))
                    by = float(np.clip(transformed[0][1] / CONFIG.width, 0, 1))
                    ball_pos = [round(bx, 4), round(by, 4)]
                except Exception:
                    # Homography failed — use raw normalized coords
                    h, w = frame.shape[:2]
                    ball_pos = [round(float(ball_xy[0] / w), 4), round(float(ball_xy[1] / h), 4)]

        # Possession from ball x position
        possession = int(ball_pos[0] * 100) if ball_pos else 50

        # Player positions (transformed to pitch coords if possible)
        player_data = None
        if len(players) > 0 and mask.sum() >= 4:
            try:
                transformer = ViewTransformer(
                    source=keypoints.xy[0][mask].astype(np.float32),
                    target=np.array(CONFIG.vertices)[mask].astype(np.float32)
                )
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


def main():
    parser = argparse.ArgumentParser(description="FlowStream CV Detector")
    parser.add_argument("--source", required=True, help="Video source: file path, RTSP URL, or 'mock'")
    parser.add_argument("--fps", type=float, default=5, help="Frames per second to emit")
    args = parser.parse_args()

    if args.source == "mock":
        run_mock(args.fps)
    else:
        run_cv(args.source, args.fps)


if __name__ == "__main__":
    main()
