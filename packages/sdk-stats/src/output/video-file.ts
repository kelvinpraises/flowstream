import { spawn, type ChildProcess } from "node:child_process";
import type { Output } from "./output.js";

export interface VideoFileOutputOptions {
  path: string;
}

export class VideoFileOutput implements Output {
  private path: string;
  private proc: ChildProcess | null = null;
  private finalized = false;

  constructor(options: VideoFileOutputOptions) {
    this.path = options.path;
  }

  async start(): Promise<void> {
    console.log(`[video-file-output] Encoding MP4 to ${this.path}...`);

    this.proc = spawn("ffmpeg", [
      "-y",
      "-f",
      "image2pipe",
      "-vcodec",
      "bmp",
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-vsync",
      "vfr",
      this.path,
    ]);

    this.proc.on("error", (err) => {
      console.error("[video-file-output] ffmpeg process error:", err);
    });

    this.proc.stdin?.on("error", (err) => {
      console.error("[video-file-output] ffmpeg stdin pipe error:", err.message);
    });

    this.proc.stderr?.on("data", () => {});
  }

  send(rendered: Buffer): void {
    if (this.proc?.stdin?.writable) {
      try {
        this.proc.stdin.write(rendered);
      } catch (err) {
        console.error("[video-file-output] Failed writing frame buffer:", err);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.finalized) return;
    this.finalized = true;

    return new Promise<void>((resolve) => {
      if (!this.proc) return resolve();
      console.log("[video-file-output] Finalizing MP4...");

      const proc = this.proc;
      proc.stdin?.end();

      proc.once("close", (code) => {
        console.log(`[video-file-output] ffmpeg exited with code ${code}`);
        this.proc = null;
        resolve();
      });
    });
  }
}
