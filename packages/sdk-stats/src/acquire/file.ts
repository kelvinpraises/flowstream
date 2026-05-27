import { spawn, type ChildProcess } from "node:child_process";
import type { FrameSource } from "./source.js";

export interface FileSourceOptions {
  path: string;
}

export class FileSource implements FrameSource {
  private path: string;
  private proc: ChildProcess | null = null;
  private queue: Buffer[] = [];
  private buffer: Buffer = Buffer.alloc(0);
  private isEnded = false;

  constructor(options: FileSourceOptions) {
    this.path = options.path;
  }

  async start(): Promise<void> {
    console.log(`[file-source] Spawning ffmpeg for ${this.path} (native frame rate)...`);
    this.proc = spawn("ffmpeg", [
      "-i",
      this.path,
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "-q:v",
      "1",
      "-",
    ]);

    this.proc.on("error", (err) => {
      console.error("[file-source] ffmpeg process error:", err);
    });

    this.proc.stderr?.on("data", () => {});

    this.proc.stdout?.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);

      while (true) {
        const startIdx = this.buffer.indexOf(Buffer.from([0xff, 0xd8]));
        if (startIdx === -1) {
          if (this.buffer.length > 1) {
            this.buffer = this.buffer.subarray(this.buffer.length - 1);
          }
          break;
        }

        const endIdx = this.buffer.indexOf(Buffer.from([0xff, 0xd9]), startIdx + 2);
        if (endIdx === -1) {
          if (startIdx > 0) {
            this.buffer = this.buffer.subarray(startIdx);
          }
          break;
        }

        const jpegFrame = this.buffer.subarray(startIdx, endIdx + 2);
        this.queue.push(jpegFrame);
        this.buffer = this.buffer.subarray(endIdx + 2);
      }
    });

    this.proc.on("close", (code) => {
      console.log(`[file-source] ffmpeg exited with code ${code}`);
      this.isEnded = true;
    });
  }

  async nextFrame(): Promise<Buffer | null> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }

    if (this.isEnded) {
      return null;
    }

    while (true) {
      if (this.queue.length > 0) {
        return this.queue.shift()!;
      }
      if (this.isEnded) {
        return this.queue.length > 0 ? this.queue.shift()! : null;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  async stop(): Promise<void> {
    if (this.proc) {
      this.proc.kill("SIGTERM");
      this.proc = null;
    }
    this.queue = [];
    this.isEnded = true;
    console.log("[file-source] Stopped");
  }
}
