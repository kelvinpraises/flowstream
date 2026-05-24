"""
FlowStream Pitch Renderer — renders ObservationFrame JSON into video.

Two modes:
  1. File mode: reads JSON lines, outputs MP4
     python render.py --input frames.jsonl --output pitch.mp4

  2. Stream mode: reads from detector via pipe, serves MJPEG on HTTP
     python detector.py --source video.mp4 --fps 5 | python render.py --stream --port 8080

     Client connects to http://localhost:8080/stream for live MJPEG video.
     This URL goes into the contract/config as the stream's video source.

The renderer draws a top-down pitch with:
  - Green pitch with white lines (regulation markings)
  - Ball position (white circle)
  - Player positions (colored by team: blue vs red)
  - Player tracking IDs
  - Score, elapsed time, possession overlay
"""

import argparse
import json
import sys
import time
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread, Lock

import cv2
import numpy as np

# Pitch dimensions in pixels
PITCH_W = 1050
PITCH_H = 680
MARGIN = 25
FIELD_W = PITCH_W - 2 * MARGIN
FIELD_H = PITCH_H - 2 * MARGIN

# Colors (BGR for OpenCV)
GREEN = (78, 138, 45)
WHITE = (255, 255, 255)
TEAM_COLORS = [
    (255, 100, 50),   # Team 0: blue
    (50, 50, 255),    # Team 1: red
    (0, 200, 200),    # Referee: yellow
    (180, 180, 180),  # Unknown: gray
]
BALL_COLOR = (255, 255, 255)
BALL_OUTLINE = (0, 0, 0)
TEXT_COLOR = (255, 255, 255)
LINE_COLOR = (255, 255, 255)


def draw_pitch(frame: np.ndarray):
    """Draw regulation football pitch markings."""
    frame[:] = GREEN

    # Outer boundary
    cv2.rectangle(frame, (MARGIN, MARGIN), (PITCH_W - MARGIN, PITCH_H - MARGIN), LINE_COLOR, 2)

    # Center line
    cv2.line(frame, (PITCH_W // 2, MARGIN), (PITCH_W // 2, PITCH_H - MARGIN), LINE_COLOR, 2)

    # Center circle
    cv2.circle(frame, (PITCH_W // 2, PITCH_H // 2), 92, LINE_COLOR, 2)
    cv2.circle(frame, (PITCH_W // 2, PITCH_H // 2), 3, LINE_COLOR, -1)

    # Penalty areas
    pa_w = int(FIELD_W * 0.165 / 1.0 * 1000 / FIELD_W)  # ~165px
    pa_h = int(FIELD_H * 0.5)  # ~315px
    pa_top = PITCH_H // 2 - pa_h // 2

    cv2.rectangle(frame, (MARGIN, pa_top), (MARGIN + 165, pa_top + pa_h), LINE_COLOR, 2)
    cv2.rectangle(frame, (PITCH_W - MARGIN - 165, pa_top), (PITCH_W - MARGIN, pa_top + pa_h), LINE_COLOR, 2)

    # Goal areas
    ga_h = int(FIELD_H * 0.24)
    ga_top = PITCH_H // 2 - ga_h // 2
    cv2.rectangle(frame, (MARGIN, ga_top), (MARGIN + 55, ga_top + ga_h), LINE_COLOR, 2)
    cv2.rectangle(frame, (PITCH_W - MARGIN - 55, ga_top), (PITCH_W - MARGIN, ga_top + ga_h), LINE_COLOR, 2)


def draw_frame(data: dict) -> np.ndarray:
    """Render a single ObservationFrame JSON dict into a pitch image."""
    img = np.zeros((PITCH_H, PITCH_W, 3), dtype=np.uint8)
    draw_pitch(img)

    # Ball
    ball = data.get("ball")
    if ball:
        bx = int(MARGIN + ball[0] * FIELD_W)
        by = int(MARGIN + ball[1] * FIELD_H)
        cv2.circle(img, (bx, by), 8, BALL_COLOR, -1)
        cv2.circle(img, (bx, by), 8, BALL_OUTLINE, 2)

    # Players
    players = data.get("players")
    if players:
        for p in players:
            px = int(MARGIN + p["x"] * FIELD_W)
            py = int(MARGIN + p["y"] * FIELD_H)
            team = p.get("team", -1)
            color = TEAM_COLORS[team] if 0 <= team < len(TEAM_COLORS) else TEAM_COLORS[-1]
            cv2.circle(img, (px, py), 10, color, -1)
            cv2.circle(img, (px, py), 10, WHITE, 1)

            # Player ID label
            pid = p.get("id", -1)
            if pid >= 0:
                cv2.putText(img, str(pid), (px - 5, py + 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, WHITE, 1, cv2.LINE_AA)

    # HUD overlay
    score = data.get("score", [0, 0])
    elapsed = data.get("min", 0)
    possession = data.get("possession", 50)

    hud = f"Score: {score[0]}-{score[1]}  |  {elapsed:.0f}'  |  Possession: {possession}%"
    cv2.putText(img, hud, (PITCH_W // 2 - 180, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, TEXT_COLOR, 1, cv2.LINE_AA)

    # FlowStream branding
    cv2.putText(img, "FLOWSTREAM", (PITCH_W - 130, PITCH_H - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (150, 150, 150), 1, cv2.LINE_AA)

    return img


def render_file(input_path: str, output_path: str, fps: float = 5):
    """Read JSON lines file and render to MP4."""
    frames = []
    with open(input_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                if "status" in data:
                    continue  # Skip status messages
                frames.append(data)
            except json.JSONDecodeError:
                continue

    if not frames:
        print("No frames to render")
        return

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (PITCH_W, PITCH_H))

    for data in frames:
        img = draw_frame(data)
        out.write(img)

    out.release()
    print(f"Rendered {len(frames)} frames to {output_path}")


# ---------------------------------------------------------------------------
# MJPEG Streaming Server
# ---------------------------------------------------------------------------

class MJPEGServer:
    """Serves rendered pitch frames as MJPEG over HTTP."""

    def __init__(self, port: int = 8080):
        self.port = port
        self.lock = Lock()
        self.current_frame: bytes = b""
        self.server: HTTPServer | None = None

    def update_frame(self, img: np.ndarray):
        """Encode and store latest frame."""
        _, jpeg = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
        with self.lock:
            self.current_frame = jpeg.tobytes()

    def get_frame(self) -> bytes:
        with self.lock:
            return self.current_frame

    def start(self):
        server_ref = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == "/stream":
                    self.send_response(200)
                    self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
                    self.send_header("Cache-Control", "no-cache")
                    self.end_headers()
                    try:
                        while True:
                            frame_data = server_ref.get_frame()
                            if frame_data:
                                self.wfile.write(b"--frame\r\n")
                                self.wfile.write(b"Content-Type: image/jpeg\r\n\r\n")
                                self.wfile.write(frame_data)
                                self.wfile.write(b"\r\n")
                            time.sleep(0.1)
                    except (BrokenPipeError, ConnectionResetError):
                        pass
                elif self.path == "/":
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html")
                    self.end_headers()
                    self.wfile.write(b"""<!DOCTYPE html>
<html><body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh">
<img src="/stream" style="max-width:100%;max-height:100vh"/>
</body></html>""")
                else:
                    self.send_response(404)
                    self.end_headers()

            def log_message(self, format, *args):
                pass  # Suppress access logs

        self.server = HTTPServer(("0.0.0.0", self.port), Handler)
        thread = Thread(target=self.server.serve_forever, daemon=True)
        thread.start()
        print(f"[render] MJPEG stream at http://localhost:{self.port}/stream")

    def stop(self):
        if self.server:
            self.server.shutdown()


def stream_mode(port: int):
    """Read JSON lines from stdin, render, and serve as MJPEG."""
    mjpeg = MJPEGServer(port=port)
    mjpeg.start()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            if "status" in data:
                print(data.get("message", ""), flush=True)
                continue
            img = draw_frame(data)
            mjpeg.update_frame(img)
        except json.JSONDecodeError:
            continue
        except KeyboardInterrupt:
            break

    mjpeg.stop()


def main():
    parser = argparse.ArgumentParser(description="FlowStream Pitch Renderer")
    parser.add_argument("--input", help="JSON lines file to render")
    parser.add_argument("--output", default="pitch-render.mp4", help="Output video path")
    parser.add_argument("--fps", type=float, default=5)
    parser.add_argument("--stream", action="store_true", help="Stream mode: read stdin, serve MJPEG")
    parser.add_argument("--port", type=int, default=8080, help="MJPEG server port")
    args = parser.parse_args()

    if args.stream:
        stream_mode(args.port)
    elif args.input:
        render_file(args.input, args.output, args.fps)
    else:
        print("Usage:")
        print("  File:   python render.py --input frames.jsonl --output pitch.mp4")
        print("  Stream: python detector.py --source video.mp4 | python render.py --stream --port 8080")


if __name__ == "__main__":
    main()
