/**
 * Output — video (or passthrough) sink for processed frames.
 */
export interface Output {
  start(): Promise<void>;

  /** Encoded video frame buffer (BMP for file output, or raw JPEG when --no-render) */
  send(video: Buffer): void;

  /** Optional: structured debug payload when --debug is set */
  sendDebug?(json: string): void;

  stop(): Promise<void>;
}
