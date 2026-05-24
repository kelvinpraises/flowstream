/**
 * Frame processing pipeline.
 *
 * Connects the adapter to the transport and storage layers.
 * Runs at the configured FPS, calling the adapter's processFrame(),
 * enriching frames with cross-frame event detection, and emitting
 * to all registered listeners.
 */

import type { ObservationFrame } from "@flowstream/types";
import type { ContentAdapter } from "../adapters/adapter.js";
import { EventDetector } from "./event-detector.js";

/** Callback for frame emission */
export type FrameListener = (frame: ObservationFrame) => void;

export class FrameEmitter {
  private adapter: ContentAdapter;
  private fps: number;
  private detector: EventDetector;
  private listeners: FrameListener[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private frameId = 0;
  private startTime = 0;

  constructor(adapter: ContentAdapter, fps: number) {
    this.adapter = adapter;
    this.fps = fps;
    this.detector = new EventDetector();
  }

  /** Register a listener for emitted frames */
  onFrame(listener: FrameListener): void {
    this.listeners.push(listener);
  }

  /** Remove a listener */
  offFrame(listener: FrameListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /** Start the frame loop */
  start(): void {
    this.running = true;
    this.startTime = Date.now();
    this.frameId = 0;

    const intervalMs = 1000 / this.fps;
    this.timer = setInterval(async () => {
      if (!this.running) return;

      const elapsedMs = Date.now() - this.startTime;
      try {
        const frame = await this.adapter.processFrame(this.frameId, elapsedMs);
        if (frame) {
          // Enrich with cross-frame event detection
          const additionalEvents = this.detector.processFrame(frame);
          if (additionalEvents.length > 0) {
            frame.events = [...frame.events, ...additionalEvents];
          }

          // Emit to all listeners
          for (const listener of this.listeners) {
            listener(frame);
          }

          this.frameId++;
        }
      } catch (err) {
        console.error("[frame-emitter] error processing frame:", err);
      }
    }, intervalMs);
  }

  /** Stop the frame loop */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Current frame count */
  get count(): number {
    return this.frameId;
  }
}
