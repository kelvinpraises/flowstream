import type { FrameSource } from "./acquire/source.js";
import type { ContentAdapter } from "./content/adapter.js";
import type { Output } from "./output/output.js";

export interface OrchestratorOptions {
  source: FrameSource;
  adapter: ContentAdapter;
  outputs: Output[];
  debug?: boolean;
  noRender?: boolean;
}

export class Orchestrator {
  private source: FrameSource;
  private adapter: ContentAdapter;
  private outputs: Output[];
  private debug: boolean;
  private noRender: boolean;

  private loopRunning = false;
  private started = false;
  private stopped = false;
  private stopping = false;
  private timer: ReturnType<typeof setImmediate> | null = null;
  private frameId = 0;
  private startTime = 0;
  private finishedResolve: (() => void) | null = null;
  private finishedPromise: Promise<void> | null = null;

  constructor(options: OrchestratorOptions) {
    this.source = options.source;
    this.adapter = options.adapter;
    this.outputs = options.outputs;
    this.debug = options.debug ?? false;
    this.noRender = options.noRender ?? false;
  }

  finished(): Promise<void> {
    if (!this.finishedPromise) {
      this.finishedPromise = new Promise((resolve) => {
        this.finishedResolve = resolve;
      });
    }
    return this.finishedPromise;
  }

  async start(): Promise<void> {
    if (this.started) return;

    await this.source.start();
    if (this.adapter.start) {
      await this.adapter.start();
    }
    for (const output of this.outputs) {
      await output.start();
    }

    this.started = true;
    this.stopped = false;
    this.stopping = false;
    this.frameId = 0;
    this.startTime = Date.now();
    this.loopRunning = true;

    console.log(
      `[orchestrator] Started (debug=${this.debug}, noRender=${this.noRender})`
    );

    const tick = async () => {
      if (!this.loopRunning) return;

      let shouldSchedule = true;

      try {
        const elapsedMs = Date.now() - this.startTime;
        const raw = await this.source.nextFrame();

        if (raw === null) {
          console.log("[orchestrator] Source ended");
          shouldSchedule = false;
          await this.stop();
          return;
        }

        const frame = await this.adapter.processFrame(raw, this.frameId, elapsedMs);
        if (!frame) {
          if (this.stopping) {
            shouldSchedule = false;
            return;
          }
          throw new Error(`[orchestrator] Adapter returned null for frame ${this.frameId}`);
        }

        const videoBuffer = this.noRender ? raw : this.adapter.render(frame);

        for (const output of this.outputs) {
          output.send(videoBuffer);
          if (this.debug && output.sendDebug) {
            output.sendDebug(JSON.stringify(frame));
          }
        }

        console.log(`[orchestrator] Frame ${this.frameId + 1}`);
        this.frameId++;
      } catch (err) {
        const failed = !this.stopping;
        if (failed) {
          console.error("[orchestrator] Tick error:", err);
        }
        shouldSchedule = false;
        await this.stop();
        if (failed) {
          throw err;
        }
      } finally {
        if (shouldSchedule && this.loopRunning) {
          this.timer = setImmediate(tick);
        }
      }
    };

    this.timer = setImmediate(tick);
    await this.finished();
  }

  async stop(): Promise<void> {
    if (this.stopped || this.stopping) return;
    this.stopping = true;
    this.loopRunning = false;

    if (this.timer) {
      clearImmediate(this.timer);
      this.timer = null;
    }

    try {
      await this.source.stop();
    } catch (err) {
      console.error("[orchestrator] Source stop error:", err);
    }

    try {
      await this.adapter.stop();
    } catch (err) {
      console.error("[orchestrator] Adapter stop error:", err);
    }

    for (const output of this.outputs) {
      try {
        await output.stop();
      } catch (err) {
        console.error("[orchestrator] Output stop error:", err);
      }
    }

    this.stopped = true;
    console.log("[orchestrator] Stopped");

    if (this.finishedResolve) {
      this.finishedResolve();
      this.finishedResolve = null;
    }
  }

  get frameCount(): number {
    return this.frameId;
  }
}
