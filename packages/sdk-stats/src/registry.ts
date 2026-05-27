import { WebCapture } from "./acquire/web-capture.js";
import { FileSource } from "./acquire/file.js";
import { FootballAdapter } from "./content/football/adapter.js";
import { VideoFileOutput } from "./output/video-file.js";
import type { FrameSource } from "./acquire/source.js";
import type { ContentAdapter } from "./content/adapter.js";
import type { Output } from "./output/output.js";

export const AcquireRegistry: Record<
  string,
  (options: { source: string; mode?: string }) => FrameSource
> = {
  webcapture: (options) =>
    new WebCapture({
      url: options.source,
      interactive: options.mode === "interactive",
    }),
  file: (options) =>
    new FileSource({
      path: options.source,
    }),
};

export const ContentRegistry: Record<
  string,
  (options: { sourcePath?: string }) => ContentAdapter
> = {
  football: (options) => new FootballAdapter(options.sourcePath),
};

export const OutputRegistry: Record<string, (options: { outFile: string }) => Output> = {
  file: (options) =>
    new VideoFileOutput({
      path: options.outFile,
    }),
};
