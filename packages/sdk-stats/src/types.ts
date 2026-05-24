/**
 * SDK-specific types for @flowstream/sdk-stats.
 *
 * Re-exports shared types from @flowstream/types plus
 * defines types specific to the observation SDK.
 */

import type { ObservationFrame } from "@flowstream/types";
import type { ContentAdapter } from "./adapters/adapter.js";

/** Configuration for the Observer instance */
export interface ObserverOptions {
  /** Content adapter that produces frames from raw input */
  adapter: ContentAdapter;
  /** WebSocket server port (default: 8765) */
  port?: number;
  /** Observation FPS (default: 5) */
  fps?: number;
  /** IPFS batch interval in seconds (default: 30) */
  ipfsInterval?: number;
  /** Observer wallet address for IPFS batch signing */
  observerAddress?: string;
  /** Callback for each frame (useful for agents consuming inline) */
  onFrame?: (frame: ObservationFrame) => void;
}

/** Configuration for WebSocket client connections */
export interface WsClientOptions {
  /** WebSocket URL to connect to (e.g., "ws://localhost:8765") */
  url: string;
  /** Auto-reconnect on disconnect (default: true) */
  reconnect?: boolean;
  /** Reconnect interval in ms (default: 3000) */
  reconnectInterval?: number;
}
