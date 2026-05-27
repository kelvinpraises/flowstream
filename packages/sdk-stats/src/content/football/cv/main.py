import sys
import json
import time
import struct
import argparse
from pathlib import Path

try:
    import supervision as sv
    import cv2
    import numpy as np
except ImportError as e:
    print(json.dumps({
        "error": f"Missing dependency: {e}. Install: pip install -r requirements.txt"
    }), flush=True)
    sys.exit(1)

from flow_cv.models import ModelRegistry
from flow_cv.pipeline import VisionPipeline

PLAYER_CLASS_ID = 2


def read_frame():
    # Read length (4-byte unsigned integer, big-endian)
    len_bytes = sys.stdin.buffer.read(4)
    if not len_bytes or len(len_bytes) < 4:
        return None
    length = struct.unpack('>I', len_bytes)[0]

    # Read the image bytes
    img_bytes = sys.stdin.buffer.read(length)
    if len(img_bytes) < length:
        return None

    # Decode image using opencv
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return frame


def main():
    parser = argparse.ArgumentParser(description="FlowStream CV Detector")
    parser.add_argument("--source", default="", help="Video source path for upfront team calibration")
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    weights_dir = script_dir / "weights"

    # Initialize models
    registry = ModelRegistry(weights_dir=weights_dir)
    registry.load_all()

    # Upfront team calibration using the original video file (stride=60).
    # This mirrors old detector.py: samples every 60th frame across the video
    # for diverse crops, ensuring correct team colors from frame 1.
    if args.source:
        registry.calibrate_team_classifier(args.source, PLAYER_CLASS_ID)
    else:
        print(json.dumps({
            "status": "ready",
            "message": "No --source provided for upfront calibration. Team classification disabled."
        }), flush=True)

    # Initialize pipeline
    pipeline = VisionPipeline(registry=registry)

    frame_id = 0
    while True:
        frame = read_frame()
        if frame is None:
            break

        now = time.time()
        output_data = pipeline.process_frame(frame, now)
        print(json.dumps(output_data), flush=True)
        frame_id += 1

    print(json.dumps({"status": "done", "frames": frame_id}), flush=True)

if __name__ == "__main__":
    main()
