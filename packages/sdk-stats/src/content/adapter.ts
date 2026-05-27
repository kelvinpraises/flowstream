import type { ObservationFrame } from "@flowstream/types";

/**
 * Content adapter — vertical-specific video middleman (e.g. football runs CV subprocess).
 * Acquires raw frames from any FrameSource; returns internal state for rendering.
 */
export interface ContentAdapter {
  readonly contentType: string;
  readonly displayName: string;

  start?(): Promise<void>;

  processFrame(
    raw: Buffer,
    frameId: number,
    elapsedMs: number
  ): Promise<ObservationFrame | null>;

  render(frame: ObservationFrame): Buffer;

  stop(): Promise<void>;
}

export interface VisualRenderer {
  readonly contentType: string;
  renderFrame(frame: ObservationFrame): Buffer;
}
