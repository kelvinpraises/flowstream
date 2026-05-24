/**
 * CLI entry point for sdk-stats observer.
 *
 * Called by: flowstream observe --source mock --port 8765 --fps 5
 * Via: npx tsx src/main.ts --source mock --port 8765 --fps 5
 */

import { Observer } from "./client.js";
import { MockAdapter } from "./adapters/mock.js";
import { FootballAdapter } from "./adapters/football.js";

const args = process.argv.slice(2);

function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const source = getArg("source", "mock");
const port = parseInt(getArg("port", "8765"), 10);
const fps = parseInt(getArg("fps", "5"), 10);
const ipfsInterval = parseInt(getArg("ipfs-interval", "30000"), 10);

// Pick adapter based on source
const adapter = source === "mock"
  ? new MockAdapter()
  : new FootballAdapter();

const observer = new Observer({
  adapter,
  port,
  fps,
  ipfsFlushInterval: ipfsInterval,
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[observer] shutting down...");
  await observer.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await observer.stop();
  process.exit(0);
});

console.log(`[observer] starting with ${source === "mock" ? "MockAdapter" : "FootballAdapter"}`);
console.log(`[observer] WebSocket on ws://localhost:${port}`);
console.log(`[observer] FPS: ${fps}, IPFS interval: ${ipfsInterval}ms`);

observer.start().catch((err) => {
  console.error("[observer] failed to start:", err);
  process.exit(1);
});
