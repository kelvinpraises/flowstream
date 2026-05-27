import sys
import json
from pathlib import Path
import numpy as np

try:
    import torch
    import supervision as sv
    from ultralytics import YOLO
except ImportError as e:
    print(json.dumps({
        "error": f"Missing dependency: {e}. Install: pip install -r requirements.txt"
    }), flush=True)
    sys.exit(1)

from flow_cv.sports.ball import BallTracker
from flow_cv.sports.team import TeamClassifier

class ModelRegistry:
    def __init__(self, weights_dir: Path):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.player_model_path = weights_dir / "football-player-detection.pt"
        self.pitch_model_path = weights_dir / "football-pitch-detection.pt"
        self.ball_model_path = weights_dir / "football-ball-detection.pt"
        
        self.player_model = None
        self.pitch_model = None
        self.ball_model = None
        
        self.ball_tracker = None
        self.player_tracker = None
        self.slicer = None
        self.team_classifier = None

    def validate_weights(self):
        for p in [self.player_model_path, self.pitch_model_path, self.ball_model_path]:
            if not p.exists():
                print(json.dumps({
                    "error": f"Model not found: {p}. Download from Roboflow and place in weights/"
                }), flush=True)
                sys.exit(1)

    def load_all(self):
        self.validate_weights()
        
        self.player_model = YOLO(str(self.player_model_path)).to(device=self.device)
        self.pitch_model = YOLO(str(self.pitch_model_path)).to(device=self.device)
        self.ball_model = YOLO(str(self.ball_model_path)).to(device=self.device)
        
        self.ball_tracker = BallTracker(buffer_size=20)
        self.player_tracker = sv.ByteTrack(minimum_consecutive_frames=3)
        
        def ball_callback(image_slice: np.ndarray) -> sv.Detections:
            result = self.ball_model(image_slice, imgsz=640, verbose=False)[0]
            return sv.Detections.from_ultralytics(result)

        self.slicer = sv.InferenceSlicer(
            callback=ball_callback,
            slice_wh=(640, 640),
        )
        
    def calibrate_team_classifier(self, source: str, player_class_id: int):
        self.team_classifier = None
        try:
            print(json.dumps({"status": "calibrating", "message": "Collecting player crops for team classification..."}), flush=True)
            frame_gen_init = sv.get_video_frames_generator(source_path=source, stride=60)
            crops = []
            for frame in frame_gen_init:
                result = self.player_model(frame, imgsz=1280, verbose=False)[0]
                detections = sv.Detections.from_ultralytics(result)
                players_det = detections[detections.class_id == player_class_id]
                crops += [sv.crop_image(frame, xyxy) for xyxy in players_det.xyxy]
                if len(crops) >= 50:
                    break

            if crops:
                self.team_classifier = TeamClassifier(device=self.device)
                self.team_classifier.fit(crops)
                print(json.dumps({"status": "ready", "message": f"Team classifier trained on {len(crops)} crops."}), flush=True)
            else:
                print(json.dumps({"status": "ready", "message": "No crops found, skipping team classification."}), flush=True)
        except Exception as e:
            print(json.dumps({"status": "ready", "message": f"Team classification unavailable: {e}. Continuing without it."}), flush=True)

