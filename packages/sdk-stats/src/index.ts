/**
 * @flowstream/sdk-stats — The Observation Layer
 *
 * Content-agnostic observation SDK for FlowStream.
 * Any live video stream becomes an observation feed
 * through the ContentAdapter pattern.
 *
 * Usage:
 *   import { Observer, MockAdapter } from "@flowstream/sdk-stats";
 *
 *   const observer = new Observer({
 *     adapter: new MockAdapter(),
 *     port: 8765,
 *   });
 *   await observer.start();
 */

// Main client class
export { Observer } from "./client.js";

// Types
export type { ObserverOptions, WsClientOptions } from "./types.js";

// Errors
export { ObserverError, AdapterError } from "./errors.js";

// Adapters
export { MockAdapter } from "./adapters/mock.js";
export { FootballAdapter } from "./adapters/football.js";
export type { ContentAdapter, VisualRenderer } from "./adapters/adapter.js";

// Transport
export { FrameServer } from "./transport/ws-server.js";
export { FrameClient } from "./transport/ws-client.js";
export type { FrameCallback, ConnectionCallback } from "./transport/ws-client.js";

// Pipeline
export { FrameEmitter } from "./pipeline/frame-emitter.js";
export { EventDetector } from "./pipeline/event-detector.js";
export type { FrameListener } from "./pipeline/frame-emitter.js";
export type { AggregateState } from "./pipeline/event-detector.js";

// Storage
export { IPFSBatcher } from "./storage/ipfs-batcher.js";

// Renderer
export { FootballRenderer } from "./renderer/football-renderer.js";
