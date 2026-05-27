/**
 * FrameSource interface.
 *
 * Repositories for grabbing raw frame buffers from input streams.
 * A FrameSource does not know about CV or what content it's loading.
 * It is solely responsible for acquiring frames at a given rate.
 */
export interface FrameSource {
  /** Initialize connection, spawn subprocesses, launch browsers */
  start(): Promise<void>;

  /**
   * Fetch the next available raw frame.
   * Returns a Buffer of the image data (PNG/JPEG) or null if the stream is finished.
   */
  nextFrame(): Promise<Buffer | null>;

  /** Release all resources gracefully */
  stop(): Promise<void>;
}
