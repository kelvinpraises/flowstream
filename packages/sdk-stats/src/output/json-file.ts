import fs from "node:fs";
import path from "node:path";
import type { Output } from "./output.js";

export interface JsonFileOutputOptions {
  path: string;
}

/** Debug-only JSONL of internal ObservationFrame snapshots */
export class JsonFileOutput implements Output {
  private filePath: string;
  private lines: string[] = [];

  constructor(options: JsonFileOutputOptions) {
    this.filePath = options.path;
  }

  async start(): Promise<void> {
    this.lines = [];
    console.log(`[debug-json] Will write frames to ${this.filePath}`);
  }

  send(_video: Buffer): void {
    // Video is handled by VideoFileOutput
  }

  sendDebug(json: string): void {
    this.lines.push(json);
  }

  async stop(): Promise<void> {
    if (this.lines.length === 0) {
      console.log("[debug-json] No frames collected, skipping write.");
      return;
    }

    const dir = path.dirname(this.filePath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.filePath, this.lines.join("\n") + "\n", "utf-8");
    console.log(`[debug-json] Wrote ${this.lines.length} frames to ${this.filePath}`);
  }
}
