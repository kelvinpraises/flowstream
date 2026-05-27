import { Orchestrator } from "./orchestrator.js";
import { AcquireRegistry, ContentRegistry, OutputRegistry } from "./registry.js";
import { JsonFileOutput } from "./output/json-file.js";
import type { Output } from "./output/output.js";

const args = process.argv.slice(2);

function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

function getArgs(name: string): string[] {
  const results: string[] = [];
  const flag = `--${name}`;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && args[i + 1] && !args[i + 1].startsWith("--")) {
      results.push(args[i + 1]);
    }
  }
  return results;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const sourcePath = getArg("source", "");
const acquireType = getArg("acquire", "");
const contentType = getArg("content", "");
const mode = getArg("mode", "auto");
const outFile = getArg("out-file", "test/result-file.mp4");
const debug = hasFlag("debug");
const debugFile = getArg("debug-file", outFile.replace(/\.[^.]+$/, ".jsonl"));
const noRender = hasFlag("no-render");

if (!sourcePath) {
  console.error("[sdk-stats] --source is required (video file path or URL)");
  process.exit(1);
}

if (!acquireType) {
  console.error("[sdk-stats] --acquire is required (file | webcapture)");
  process.exit(1);
}

if (!contentType) {
  console.error("[sdk-stats] --content is required (e.g. football)");
  process.exit(1);
}

const acquireFactory = AcquireRegistry[acquireType];
if (!acquireFactory) {
  console.error(
    `[sdk-stats] Unknown --acquire "${acquireType}". Supported: ${Object.keys(AcquireRegistry).join(", ")}`
  );
  process.exit(1);
}

const contentFactory = ContentRegistry[contentType];
if (!contentFactory) {
  console.error(
    `[sdk-stats] Unknown --content "${contentType}". Supported: ${Object.keys(ContentRegistry).join(", ")}`
  );
  process.exit(1);
}

const source = acquireFactory({ source: sourcePath, mode });
const adapter = contentFactory({ sourcePath });

let outputKeys = getArgs("output");
if (outputKeys.length === 0) {
  outputKeys = ["file"];
}

const outputs: Output[] = [];
for (const key of outputKeys) {
  const outputFactory = OutputRegistry[key];
  if (!outputFactory) {
    console.error(
      `[sdk-stats] Unknown --output "${key}". Supported: ${Object.keys(OutputRegistry).join(", ")}`
    );
    process.exit(1);
  }
  outputs.push(outputFactory({ outFile }));
}

if (debug) {
  outputs.push(new JsonFileOutput({ path: debugFile }));
}

const orchestrator = new Orchestrator({
  source,
  adapter,
  outputs,
  debug,
  noRender,
});

async function shutdown(code: number): Promise<void> {
  await orchestrator.stop();
  process.exit(code);
}

process.on("SIGINT", () => {
  console.log("\n[sdk-stats] Shutting down...");
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

console.log("[sdk-stats] Starting");
console.log(`[sdk-stats]   source   : ${sourcePath}`);
console.log(`[sdk-stats]   acquire  : ${acquireType}`);
console.log(`[sdk-stats]   content  : ${contentType}`);
console.log(`[sdk-stats]   outputs  : ${outputKeys.join(", ")}${debug ? " + debug-json" : ""}`);
console.log(`[sdk-stats]   out-file : ${outFile}`);
if (debug) console.log(`[sdk-stats]   debug    : ${debugFile}`);

orchestrator
  .start()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[sdk-stats] Failed:", err);
    process.exit(1);
  });
