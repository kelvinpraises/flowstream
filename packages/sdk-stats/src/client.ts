/**
 * Observer — the main entry point for @flowstream/sdk-stats.
 *
 * Migrated from drafts/sdk-stats/app/src/observer.ts.
 * Refactored to use the ContentAdapter pattern instead of
 * hardcoding mock/cv-bridge. The Observer is content-agnostic:
 * it takes an adapter, pipes its output through the pipeline,
 * broadcasts via WebSocket, and batches to IPFS.
 *
 * Usage:
 *   const observer = new Observer({
 *     adapter: new MockAdapter(),
 *     port: 8765,
 *   });
 *   await observer.start();
 */

import type { ObservationFrame } from "@flowstream/types";
import { DEFAULT_WS_PORT, DEFAULT_FPS, DEFAULT_IPFS_INTERVAL } from "@flowstream/types";
import type { ObserverOptions } from "./types.js";
import { FrameEmitter } from "./pipeline/frame-emitter.js";
import { FrameServer } from "./transport/ws-server.js";
import { IPFSBatcher } from "./storage/ipfs-batcher.js";

export class Observer {
  private adapter;
  private fps: number;
  private ws: FrameServer;
  private ipfs: IPFSBatcher;
  private emitter: FrameEmitter;
  private running = false;
  private ipfsTimer: ReturnType<typeof setInterval> | null = null;
  private lastFrame: ObservationFrame | null = null;
  private onFrameCallback?: (frame: ObservationFrame) => void;

  constructor(options: ObserverOptions) {
    this.adapter = options.adapter;
    this.fps = options.fps ?? DEFAULT_FPS;
    this.onFrameCallback = options.onFrame;

    // Initialize transport
    this.ws = new FrameServer(options.port ?? DEFAULT_WS_PORT);

    // Initialize storage
    this.ipfs = new IPFSBatcher(
      "observer", // source identifier
      this.adapter.contentType,
      options.observerAddress,
      (options.ipfsInterval ?? DEFAULT_IPFS_INTERVAL) * 1000
    );

    // Initialize pipeline
    this.emitter = new FrameEmitter(this.adapter, this.fps);
  }

  /** Start the observation pipeline + WebSocket server */
  async start(): Promise<void> {
    // Initialize the adapter (load models, connect to sources, etc.)
    await this.adapter.initialize("observer", this.fps);

    // Start the WebSocket server
    await this.ws.start();

    // Wire up the frame pipeline
    this.emitter.onFrame((frame) => {
      this.lastFrame = frame;

      // Broadcast to WebSocket clients
      const json = JSON.stringify(frame);
      this.ws.broadcast(json);

      // Buffer for IPFS batching
      this.ipfs.addFrame(frame);

      // Call user callback if provided
      if (this.onFrameCallback) {
        this.onFrameCallback(frame);
      }
    });

    // Start the frame loop
    this.emitter.start();
    this.running = true;

    // Start IPFS flush check loop
    this.startIPFSLoop();

    console.log(
      `[observer] started: adapter=${this.adapter.displayName}, fps=${this.fps}`
    );
  }

  /** Stop gracefully, flush final IPFS batch */
  async stop(): Promise<void> {
    this.running = false;

    // Stop the frame loop
    this.emitter.stop();

    // Stop IPFS timer
    if (this.ipfsTimer) {
      clearInterval(this.ipfsTimer);
      this.ipfsTimer = null;
    }

    // Final IPFS flush
    if (this.ipfs.shouldFlush()) {
      await this.doFlush();
    }

    // Destroy the adapter
    await this.adapter.destroy();

    // Stop WebSocket server
    await this.ws.stop();

    console.log("[observer] stopped");
  }

  /** Current frame count */
  get frameCount(): number {
    return this.emitter.count;
  }

  /** Number of connected WebSocket clients */
  get clientCount(): number {
    return this.ws.clientCount;
  }

  /** The most recent frame produced */
  get latestFrame(): ObservationFrame | null {
    return this.lastFrame;
  }

  /** Whether the observer is currently running */
  get isRunning(): boolean {
    return this.running;
  }

  private startIPFSLoop(): void {
    this.ipfsTimer = setInterval(async () => {
      if (this.ipfs.shouldFlush()) {
        await this.doFlush();
      }
    }, 1000);
  }

  private async doFlush(): Promise<void> {
    const f = this.lastFrame;
    const momentum = f?.momentum ?? 50;
    await this.ipfs.flush({
      score: f ? ([...f.score] as [number, number]) : [0, 0],
      elapsed: f?.elapsed ?? 0,
      period: f?.period ?? 1,
      momentum: [momentum, 100 - momentum],
    });
  }
}
