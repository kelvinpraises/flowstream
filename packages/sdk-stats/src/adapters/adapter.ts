/**
 * ContentAdapter and VisualRenderer interfaces.
 *
 * The adapter pattern is what makes FlowStream content-agnostic.
 * Adding a new content vertical (esports, debates, concerts)
 * means writing one adapter file that implements ContentAdapter.
 */

import type { ObservationFrame, ObservationEvent, ObservationBatch } from "@flowstream/types";

/**
 * A ContentAdapter processes raw input (video frames, audio, API data)
 * and produces normalized ObservationFrames.
 *
 * Two responsibilities:
 * 1. OBSERVE: raw input -> ObservationFrame (extract facts from content)
 * 2. RENDER: ObservationFrame -> visual representation (optional, via VisualRenderer)
 *
 * The observer pipeline calls `processFrame()` at the configured FPS.
 * The adapter maintains its own internal state (e.g., match state, player tracking).
 */
export interface ContentAdapter {
  /** Unique content type identifier. Must match ObservationFrame.contentType. */
  readonly contentType: string;

  /** Human-readable name for logging/display */
  readonly displayName: string;

  /**
   * Initialize the adapter. Called once before processFrame starts.
   * Use for loading models, connecting to APIs, warming caches, etc.
   *
   * @param source - The input source (video URL, file path, "mock", API endpoint)
   * @param fps - Target frames per second
   */
  initialize(source: string, fps: number): Promise<void>;

  /**
   * Process a single frame/tick and return a normalized ObservationFrame.
   * Called at the configured FPS rate.
   *
   * @param frameId - Monotonically increasing frame counter
   * @param elapsedMs - Milliseconds since observation started
   * @returns An ObservationFrame, or null to skip this frame
   */
  processFrame(frameId: number, elapsedMs: number): Promise<ObservationFrame | null>;

  /**
   * Clean up resources. Called on Observer.stop().
   */
  destroy(): Promise<void>;
}

/**
 * Optional interface for adapters that can render visual representations
 * from observation data. This is the INDEPENDENT RENDERING capability
 * (NBA v. Motorola: independent observation + independent rendering).
 *
 * Not all adapters need to render. Football does (virtual pitch).
 * A debate adapter might render a speaker timeline.
 * Some adapters may be observation-only.
 */
export interface VisualRenderer {
  /** Content type this renderer handles */
  readonly contentType: string;

  /**
   * Render an ObservationFrame as an HTML string or data URL.
   * Used for generating visual representations without the original video.
   *
   * @param frame - The observation data to visualize
   * @returns HTML string, SVG string, or data URL
   */
  renderFrame(frame: ObservationFrame): string;

  /**
   * Render a batch summary as a static visualization.
   * Used for IPFS-stored snapshots.
   */
  renderBatchSummary?(batch: ObservationBatch): string;
}
