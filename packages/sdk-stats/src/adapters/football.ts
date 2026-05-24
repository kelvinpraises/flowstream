/**
 * FootballAdapter — real CV implementation via Python subprocess.
 *
 * Wraps the Python CV pipeline (Roboflow sports models) as a subprocess.
 * The Python side (cv/detector.py) runs:
 * - YOLOv8 player detection
 * - YOLOv8 ball detection
 * - Pitch keypoint detection + ViewTransformer
 * - SigLIP team classification
 * - ByteTrack player tracking
 *
 * It outputs one JSON line per processed frame to stdout.
 * This adapter reads those lines and maps them to ObservationFrames.
 *
 * Migrated from drafts/sdk-stats/app/src/cv-bridge.ts.
 */

import type { ContentAdapter } from "./adapter.js";
import type { ObservationFrame, ObservationEvent, EventType } from "@flowstream/types";
import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { AdapterError } from "@flowstream/types";

/** Maps football-specific event types to content-agnostic EventType */
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

export class FootballAdapter implements ContentAdapter {
  readonly contentType = "football";
  readonly displayName = "Football (CV)";

  private proc: ChildProcess | null = null;
  private latestFrame: ObservationFrame | null = null;
  private source = "";
  private fps = 5;

  async initialize(source: string, fps: number): Promise<void> {
    this.source = source;
    this.fps = fps;

    // Spawn Python CV process
    this.proc = spawn("python3", [
      "cv/detector.py",
      "--source",
      source,
      "--fps",
      String(fps),
    ]);

    // Handle process errors
    this.proc.on("error", (err) => {
      console.error("[football-adapter] failed to spawn CV process:", err.message);
    });

    this.proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error("[football-adapter] cv stderr:", msg);
    });

    // Process stdout lines asynchronously into latestFrame
    if (this.proc.stdout) {
      const rl = createInterface({ input: this.proc.stdout });
      rl.on("line", (line) => {
        try {
          const raw = JSON.parse(line);
          this.latestFrame = this.mapToFrame(raw);
        } catch {
          // Skip malformed JSON lines
        }
      });
    }
  }

  async processFrame(frameId: number, _elapsedMs: number): Promise<ObservationFrame | null> {
    // Return latest CV frame (may be null if CV hasn't produced one yet)
    if (!this.latestFrame) return null;
    return { ...this.latestFrame, frame: frameId };
  }

  async destroy(): Promise<void> {
    if (this.proc) {
      this.proc.kill("SIGTERM");
      this.proc = null;
    }
  }

  /**
   * Map raw Python CV output to normalized ObservationFrame.
   * The Python output uses football-specific field names;
   * this method normalizes them to the content-agnostic schema.
   */
  private mapToFrame(raw: Record<string, unknown>): ObservationFrame {
    const rawBall = raw.ball as [number, number] | null | undefined;
    const rawEvents = (raw.events ?? []) as Array<Record<string, unknown>>;
    const rawScore = (raw.score ?? [0, 0]) as [number, number];
    const rawMin = (raw.min ?? 0) as number;
    const rawPeriod = (raw.period ?? 1) as number;
    const rawPossession = (raw.possession ?? 50) as number;

    return {
      frame: 0, // Will be overwritten by processFrame
      ts: (raw.ts as number) ?? Date.now(),
      contentType: "football",
      primaryPosition: rawBall ?? null,
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

  /** Map a single football event to a content-agnostic ObservationEvent */
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
