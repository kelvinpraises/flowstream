import time
import numpy as np
import supervision as sv

from flow_cv.models import ModelRegistry
from flow_cv.serializers import format_frame
from flow_cv.sports.view import ViewTransformer
from flow_cv.sports.soccer import SoccerPitchConfiguration

CONFIG = SoccerPitchConfiguration()
PLAYER_CLASS_ID = 2

class VisionPipeline:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.score = [0, 0]
        self.period = 1
        self.start_time = time.time()
        
    def process_frame(self, frame: np.ndarray, now: float) -> dict:
        elapsed_ms = (now - self.start_time) * 1000
        game_min = elapsed_ms / 1000 / 60

        # --- Pitch keypoints ---
        pitch_result = self.registry.pitch_model(frame, verbose=False)[0]
        keypoints = sv.KeyPoints.from_ultralytics(pitch_result)
        mask = (keypoints.xy[0][:, 0] > 1) & (keypoints.xy[0][:, 1] > 1)

        # --- Player detection + tracking ---
        player_result = self.registry.player_model(frame, imgsz=1280, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(player_result)
        detections = self.registry.player_tracker.update_with_detections(detections)

        players = detections[detections.class_id == PLAYER_CLASS_ID]
        player_crops = [sv.crop_image(frame, xyxy) for xyxy in players.xyxy]
        
        team_classifier = self.registry.team_classifier
        players_team_id = team_classifier.predict(player_crops) if (team_classifier and player_crops) else np.array([])

        # --- Ball detection ---
        ball_detections = self.registry.slicer(frame).with_nms(threshold=0.1)
        ball_detections = self.registry.ball_tracker.update(ball_detections)

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
        
        return format_frame(
            ts=int(now * 1000),
            ball_pos=ball_pos,
            score=self.score,
            game_min=game_min,
            period=self.period,
            possession=possession,
            events=events,
            player_data=player_data
        )
