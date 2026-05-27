import { describe, it, expect } from "vitest";
import type { ObservationFrame } from "@flowstream/types";
import type { FrameSource } from "../src/acquire/source.js";
import type { ContentAdapter } from "../src/content/adapter.js";
import type { Output } from "../src/output/output.js";
import { Orchestrator } from "../src/orchestrator.js";

class FakeSource implements FrameSource {
  private remaining: (Buffer | null)[];
  constructor(frames: Buffer[]) {
    this.remaining = [...frames, null];
  }
  async start(): Promise<void> {}
  async nextFrame(): Promise<Buffer | null> {
    return this.remaining.shift() ?? null;
  }
  async stop(): Promise<void> {}
}

class FakeAdapter implements ContentAdapter {
  readonly contentType = "test";
  readonly displayName = "Test";
  async processFrame(raw: Buffer, frameId: number): Promise<ObservationFrame> {
    return {
      frame: frameId,
      ts: Date.now(),
      contentType: "test",
      primaryPosition: null,
      momentum: 50,
      events: [],
      score: [0, 0],
      elapsed: 0,
      period: 1,
    };
  }
  render(): Buffer {
    return Buffer.from("bmp");
  }
  async stop(): Promise<void> {}
}

class CollectingOutput implements Output {
  video: Buffer[] = [];
  debug: string[] = [];
  async start(): Promise<void> {}
  send(video: Buffer): void {
    this.video.push(video);
  }
  sendDebug(json: string): void {
    this.debug.push(json);
  }
  async stop(): Promise<void> {}
}

describe("Orchestrator", () => {
  it("processes every source frame and stops idempotently", async () => {
    const source = new FakeSource([Buffer.from("a"), Buffer.from("b")]);
    const adapter = new FakeAdapter();
    const output = new CollectingOutput();

    const orchestrator = new Orchestrator({
      source,
      adapter,
      outputs: [output],
      debug: true,
    });

    await orchestrator.start();
    expect(orchestrator.frameCount).toBe(2);
    expect(output.video).toHaveLength(2);
    expect(output.debug).toHaveLength(2);

    await orchestrator.stop();
    await orchestrator.stop();
  });

  it("passthrough mode sends raw frames when noRender is set", async () => {
    const raw = Buffer.from("jpeg-bytes");
    const source = new FakeSource([raw]);
    const adapter = new FakeAdapter();
    const output = new CollectingOutput();

    const orchestrator = new Orchestrator({
      source,
      adapter,
      outputs: [output],
      noRender: true,
    });

    await orchestrator.start();
    expect(output.video[0]).toEqual(raw);
  });
});
