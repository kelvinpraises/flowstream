/**
 * WebSocket client — connects to an observation feed and receives frames.
 *
 * Used by bookmaker agents, steward agents, and other consumers
 * that need to receive real-time observation data.
 */

import WebSocket from "ws";
import type { ObservationFrame } from "@flowstream/types";
import type { WsClientOptions } from "../types.js";

/** Callback for received frames */
export type FrameCallback = (frame: ObservationFrame) => void;

/** Callback for connection events */
export type ConnectionCallback = () => void;

export class FrameClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnect: boolean;
  private reconnectInterval: number;
  private frameCallbacks: FrameCallback[] = [];
  private connectCallbacks: ConnectionCallback[] = [];
  private disconnectCallbacks: ConnectionCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(options: WsClientOptions) {
    this.url = options.url;
    this.reconnect = options.reconnect ?? true;
    this.reconnectInterval = options.reconnectInterval ?? 3000;
  }

  /** Register a callback for received frames */
  onFrame(callback: FrameCallback): void {
    this.frameCallbacks.push(callback);
  }

  /** Register a callback for connection established */
  onConnect(callback: ConnectionCallback): void {
    this.connectCallbacks.push(callback);
  }

  /** Register a callback for disconnection */
  onDisconnect(callback: ConnectionCallback): void {
    this.disconnectCallbacks.push(callback);
  }

  /** Connect to the observation feed */
  connect(): void {
    this.intentionalClose = false;
    this.doConnect();
  }

  /** Disconnect from the observation feed */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** Whether the client is currently connected */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private doConnect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.on("open", () => {
      console.log(`[ws-client] connected to ${this.url}`);
      for (const cb of this.connectCallbacks) cb();
    });

    this.ws.on("message", (data) => {
      try {
        const frame = JSON.parse(data.toString()) as ObservationFrame;
        for (const cb of this.frameCallbacks) cb(frame);
      } catch {
        // Skip malformed messages
      }
    });

    this.ws.on("close", () => {
      for (const cb of this.disconnectCallbacks) cb();
      if (!this.intentionalClose && this.reconnect) {
        console.log(
          `[ws-client] disconnected, reconnecting in ${this.reconnectInterval}ms...`
        );
        this.reconnectTimer = setTimeout(() => this.doConnect(), this.reconnectInterval);
      }
    });

    this.ws.on("error", (err) => {
      console.error("[ws-client] error:", err.message);
    });
  }
}
