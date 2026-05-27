/**
 * @flowstream/sdk-stats — video in, processed video out.
 * Content adapters (e.g. football) hook the middle; CLI is a thin registry wrapper.
 */

export { Orchestrator } from "./orchestrator.js";
export type { OrchestratorOptions } from "./orchestrator.js";

export { WebCapture } from "./acquire/web-capture.js";
export { FileSource } from "./acquire/file.js";
export type { FrameSource } from "./acquire/source.js";

export { FootballAdapter } from "./content/football/adapter.js";
export { FootballRenderer } from "./content/football/renderer.js";
export type { ContentAdapter, VisualRenderer } from "./content/adapter.js";

export { VideoFileOutput } from "./output/video-file.js";
export { JsonFileOutput } from "./output/json-file.js";
export type { Output } from "./output/output.js";

export { ObserverError, AdapterError } from "./errors.js";
