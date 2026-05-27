import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it, expect } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const E2E_ARGS = [
  "--acquire",
  "file",
  "--source",
  path.join(ROOT, "test/test-10s.mp4"),
  "--content",
  "football",
  "--output",
  "file",
] as const;

function runMain(extraArgs: string[]): Promise<{ code: number; stderr: string }> {
  const mainPath = path.join(ROOT, "dist/main.js");
  let stderr = "";

  return new Promise((resolve) => {
    const proc = spawn("node", [mainPath, ...E2E_ARGS, ...extraArgs], { cwd: ROOT });
    proc.stderr.on("data", (d) => {
      const chunk = d.toString();
      stderr += chunk;
      console.error("[e2e stderr]", chunk.trim());
    });
    proc.stdout.on("data", (d) => console.log("[e2e stdout]", d.toString().trim()));
    proc.on("close", (code) => resolve({ code: code ?? 1, stderr }));
  });
}

beforeAll(() => {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
});

describe("E2E file → football → video", () => {
  it("writes an MP4 from a local test clip", async () => {
    const outPath = path.join(ROOT, "test/result-file.mp4");
    expect(fs.existsSync(path.join(ROOT, "test/test-10s.mp4"))).toBe(true);

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    const { code, stderr } = await runMain(["--out-file", outPath]);

    expect(code, stderr.slice(-2000)).toBe(0);
    expect(fs.existsSync(outPath)).toBe(true);
    expect(fs.statSync(outPath).size).toBeGreaterThan(0);
  });

  it("writes debug JSONL when --debug is set", async () => {
    const outPath = path.join(ROOT, "test/result-debug.mp4");
    const debugPath = path.join(ROOT, "test/result-debug.jsonl");

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    if (fs.existsSync(debugPath)) fs.unlinkSync(debugPath);

    const { code, stderr } = await runMain([
      "--out-file",
      outPath,
      "--debug",
      "--debug-file",
      debugPath,
    ]);

    expect(code, stderr.slice(-2000)).toBe(0);
    expect(fs.existsSync(debugPath)).toBe(true);
    const lines = fs.readFileSync(debugPath, "utf-8").trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(JSON.parse(line).contentType).toBe("football");
    }
  });
});
