/**
 * WebSocket server — serves observation frames to connected clients.
 *
 * Migrated nearly 1:1 from drafts/sdk-stats/app/src/websocket.ts.
 * Multi-client support: all clients receive the same frame data.
 * New clients immediately receive the latest frame on connection.
 */

import { WebSocketServer, WebSocket } from "ws";

export class FrameServer {
  private wss: WebSocketServer | null = null;
  private clients = new Set<WebSocket>();
  private latest = "{}";

  constructor(
    private port: number = 8765,
    private host: string = "0.0.0.0"
  ) {}

  /** Start the WebSocket server */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({ port: this.port, host: this.host });

      this.wss.on("connection", (ws) => {
        this.clients.add(ws);
        // Send latest frame immediately so new clients aren't stale
        ws.send(this.latest);

        ws.on("close", () => this.clients.delete(ws));
        ws.on("error", () => this.clients.delete(ws));
      });

      this.wss.on("listening", () => {
        console.log(`[ws-server] listening on ws://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  /** Broadcast a JSON string to all connected clients */
  broadcast(frameJson: string): void {
    this.latest = frameJson;
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(frameJson);
      }
    }
  }

  /** Stop the server gracefully */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) return resolve();
      for (const ws of this.clients) ws.close();
      this.wss.close(() => resolve());
    });
  }

  /** Number of connected clients */
  get clientCount(): number {
    return this.clients.size;
  }
}
