/**
 * ObservationConsumer — WebSocket client consuming the stats feed.
 *
 * Connects to an sdk-stats observation feed, parses incoming
 * ObservationFrame JSON messages, maintains a sliding buffer,
 * and invokes registered callbacks for each frame.
 *
 * Handles reconnection with exponential backoff.
 */

import WebSocket from "ws";
import type { ObservationFrame } from "@flowstream/types";
import { FeedConnectionError } from "../errors.js";

export interface ObservationConsumerOptions {
  /** WebSocket URL of the observation feed */
  url: string;
  /** Maximum frames to keep in buffer (default: 1500 = ~5 min at 5fps) */
  maxBufferSize?: number;
  /** Maximum reconnect attempts before giving up (default: 10) */
  maxReconnects?: number;
  /** Base reconnect delay in milliseconds (default: 1000) */
  reconnectBaseDelay?: number;
}

export type FrameCallback = (frame: ObservationFrame) => void;
export type ErrorCallback = (error: Error) => void;

export class ObservationConsumer {
  private readonly url: string;
  private readonly maxBufferSize: number;
  private readonly maxReconnects: number;
  private readonly reconnectBaseDelay: number;

  private ws: WebSocket | null = null;
  private _buffer: ObservationFrame[] = [];
  private frameCallbacks: FrameCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _running = false;

  constructor(options: ObservationConsumerOptions) {
    this.url = options.url;
    this.maxBufferSize = options.maxBufferSize ?? 1500;
    this.maxReconnects = options.maxReconnects ?? 10;
    this.reconnectBaseDelay = options.reconnectBaseDelay ?? 1000;
  }

  /** Register a callback for each incoming frame */
  onFrame(cb: FrameCallback): void {
    this.frameCallbacks.push(cb);
  }

  /** Register a callback for connection/parsing errors */
  onError(cb: ErrorCallback): void {
    this.errorCallbacks.push(cb);
  }

  /** Current observation frame buffer (oldest first) */
  get buffer(): ObservationFrame[] {
    return this._buffer;
  }

  /** Whether the consumer is actively connected */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Whether the consumer has been started (may be reconnecting) */
  get running(): boolean {
    return this._running;
  }

  /** Connect to the feed and start consuming frames */
  async connect(): Promise<void> {
    this._running = true;
    this.reconnectAttempts = 0;
    return this.doConnect();
  }

  /** Disconnect and stop reconnecting */
  disconnect(): void {
    this._running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  /** Clear the frame buffer */
  clearBuffer(): void {
    this._buffer = [];
  }

  // -------------------------------------------------------------------------

  private doConnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        const feedErr = new FeedConnectionError(this.url, {
          cause: err instanceof Error ? err : undefined,
        });
        this.emitError(feedErr);
        reject(feedErr);
        return;
      }

      this.ws.on("open", () => {
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on("error", (err: Error) => {
        const feedErr = new FeedConnectionError(this.url, { cause: err });
        this.emitError(feedErr);
        // If this is the initial connection attempt, reject.
        // Subsequent errors just trigger reconnect via 'close'.
      });

      this.ws.on("close", () => {
        if (this._running) {
          this.scheduleReconnect();
        }
      });

      // Reject after a timeout if we haven't connected
      const timeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          const err = new FeedConnectionError(this.url, {
            details: "Connection timeout",
          });
          this.emitError(err);
          reject(err);
        }
      }, 10_000);

      // Clean up timeout on success
      this.ws.on("open", () => clearTimeout(timeout));
    });
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      let raw: string;
      if (typeof data === "string") {
        raw = data;
      } else if (Buffer.isBuffer(data)) {
        raw = data.toString("utf-8");
      } else if (data instanceof ArrayBuffer) {
        raw = Buffer.from(data).toString("utf-8");
      } else {
        // Buffer[] — concatenate
        raw = Buffer.concat(data as Buffer[]).toString("utf-8");
      }
      const frame = JSON.parse(raw) as ObservationFrame;

      // Basic validation
      if (typeof frame.frame !== "number" || typeof frame.ts !== "number") {
        return; // Skip malformed frames
      }

      // Append to buffer
      this._buffer.push(frame);

      // Trim buffer to max size
      if (this._buffer.length > this.maxBufferSize) {
        this._buffer = this._buffer.slice(-this.maxBufferSize);
      }

      // Notify listeners
      for (const cb of this.frameCallbacks) {
        try {
          cb(frame);
        } catch {
          // Don't let a bad callback kill the consumer
        }
      }
    } catch {
      // JSON parse failure — skip
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnects) {
      const err = new FeedConnectionError(this.url, {
        details: `Exceeded max reconnect attempts (${this.maxReconnects})`,
      });
      this.emitError(err);
      this._running = false;
      return;
    }

    const delay =
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (this._running) {
        this.doConnect().catch(() => {
          // Reconnect failure is handled by the close event
        });
      }
    }, delay);
  }

  private emitError(err: Error): void {
    for (const cb of this.errorCallbacks) {
      try {
        cb(err);
      } catch {
        // Don't let a bad callback kill us
      }
    }
  }
}
