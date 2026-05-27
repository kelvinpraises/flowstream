import fs from "node:fs";
import type { ContentAdapter } from "../adapter.js";
import type { ObservationFrame, ObservationEvent, EventType } from "@flowstream/types";
import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { FootballRenderer } from "./renderer.js";

const FOOTBALL_EVENT_MAP: Record<string, EventType> = {
  goal: "score_change",
  shot: "action",
  foul: "violation",
  corner: "action",
  offside: "violation",
  card: "violation",
  possession_change: "momentum_shift",
  substitution: "participant_change",
  half_time: "phase_change",
};

const FRAME_TIMEOUT_MS = 120_000;

function resolvePythonExecutable(adapterDir: string): string {
  if (process.env.FLOWSTREAM_PYTHON) return process.env.FLOWSTREAM_PYTHON;
  if (process.env.PYTHON) return process.env.PYTHON;

  const packageRoot = path.resolve(adapterDir, "../../..");
  const candidates = [
    path.join(packageRoot, "venv/bin/python3"),
    path.join(packageRoot, ".venv/bin/python3"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "python3";
}

type Inflight = {
  frameId: number;
  resolve: (frame: ObservationFrame | null) => void;
  reject: (err: Error) => void;
};

export class FootballAdapter implements ContentAdapter {
  readonly contentType = "football";
  readonly displayName = "Football";

  private proc: ChildProcess | null = null;
  private inflight: Inflight | null = null;
  private renderer: FootballRenderer;
  private sourcePath: string;
  private pythonPath: string;

  constructor(sourcePath?: string) {
    this.renderer = new FootballRenderer();
    this.sourcePath = sourcePath ?? "";
    const adapterDir = path.dirname(fileURLToPath(import.meta.url));
    this.pythonPath = resolvePythonExecutable(adapterDir);
  }

  async start(): Promise<void> {
    const adapterDir = path.dirname(fileURLToPath(import.meta.url));
    const scriptPath = path.join(adapterDir, "cv", "main.py");

    const pyArgs = [scriptPath];
    if (this.sourcePath) {
      pyArgs.push("--source", this.sourcePath);
    }

    console.log(`[football] Spawning CV subprocess: ${this.pythonPath} ${pyArgs.join(" ")}`);
    this.proc = spawn(this.pythonPath, pyArgs);

    this.proc.on("error", (err) => {
      console.error("[football] Python spawn error:", err.message);
      this.rejectInflight(new Error(`Python spawn failed: ${err.message}`));
    });

    this.proc.on("exit", (code, signal) => {
      if (code !== 0 && code !== null) {
        this.rejectInflight(new Error(`Python exited with code ${code} (signal ${signal})`));
      }
    });

    this.proc.stdin?.on("error", (err) => {
      console.error("[football] stdin error:", err.message);
    });

    this.proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error("[football] stderr:", msg);
    });

    if (this.proc.stdout) {
      const rl = createInterface({ input: this.proc.stdout });
      rl.on("line", (line) => {
        try {
          const raw = JSON.parse(line);

          if (raw.status === "calibrating" || raw.status === "ready") {
            console.log(`[football] ${raw.message ?? raw.status}`);
            return;
          }

          if (raw.status === "done") {
            return;
          }

          if (raw.ts !== undefined && this.inflight) {
            const { resolve, frameId } = this.inflight;
            this.inflight = null;
            const frame = this.mapToFrame(raw);
            frame.frame = frameId;
            resolve(frame);
          }
        } catch {
          // ignore malformed lines
        }
      });
    }
  }

  async processFrame(
    raw: Buffer,
    frameId: number,
    _elapsedMs: number
  ): Promise<ObservationFrame | null> {
    if (!this.proc?.stdin) {
      throw new Error("[football] CV subprocess not running");
    }

    if (this.inflight) {
      throw new Error(`[football] Frame ${frameId} requested while frame ${this.inflight.frameId} is in flight`);
    }

    return new Promise<ObservationFrame | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.inflight?.frameId === frameId) {
          this.inflight = null;
          reject(new Error(`[football] CV timeout on frame ${frameId} after ${FRAME_TIMEOUT_MS}ms`));
        }
      }, FRAME_TIMEOUT_MS);

      this.inflight = {
        frameId,
        resolve: (frame) => {
          clearTimeout(timeout);
          resolve(frame);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      };

      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(raw.length, 0);
      try {
        this.proc!.stdin!.write(lenBuf);
        this.proc!.stdin!.write(raw);
      } catch (err) {
        clearTimeout(timeout);
        this.inflight = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  render(frame: ObservationFrame): Buffer {
    return this.renderer.renderFrame(frame);
  }

  async stop(): Promise<void> {
    if (this.inflight) {
      const { resolve } = this.inflight;
      this.inflight = null;
      resolve(null);
    }

    if (this.proc) {
      this.proc.kill("SIGTERM");
      this.proc = null;
    }
    console.log("[football] Stopped");
  }

  private rejectInflight(err: Error): void {
    if (this.inflight) {
      this.inflight.reject(err);
      this.inflight = null;
    }
  }

  private mapToFrame(raw: Record<string, unknown>): ObservationFrame {
    const rawBall = raw.ball as [number, number] | null | undefined;
    const rawEvents = (raw.events ?? []) as Array<Record<string, unknown>>;
    const rawScore = (raw.score ?? [0, 0]) as [number, number];
    const rawMin = (raw.min ?? 0) as number;
    const rawPeriod = (raw.period ?? 1) as number;
    const rawPossession = (raw.possession ?? 50) as number;

    return {
      frame: 0,
      ts: (raw.ts as number) ?? Date.now(),
      contentType: "football",
      primaryPosition: rawBall
        ? [rawBall[0] * 105 - 52.5, rawBall[1] * 68 - 34]
        : null,
      momentum: rawPossession,
      events: rawEvents.map((e) => this.mapEvent(e)),
      score: rawScore,
      elapsed: rawMin,
      period: rawPeriod,
      meta: {
        players: raw.players,
        formations: raw.formations,
      },
    };
  }

  private mapEvent(e: Record<string, unknown>): ObservationEvent {
    const originalType = (e.t as string) ?? "action";
    return {
      type: FOOTBALL_EVENT_MAP[originalType] ?? "action",
      side: ((e.team as number) ?? 0) as 0 | 1,
      at: (e.min as number) ?? 0,
      data: { ...e, originalType },
    };
  }
}
