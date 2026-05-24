/**
 * IPFS batch upload — aggregates observation frames and flushes to IPFS.
 *
 * Migrated from drafts/sdk-stats/app/src/ipfs.ts.
 * Updated to use the content-agnostic ObservationBatch type
 * from @flowstream/types.
 *
 * For hackathon: generates a mock CID from SHA-256 hash of batch JSON.
 * Real IPFS upload (pinning to Pinata/web3.storage) is a future enhancement.
 */

import { createHash } from "node:crypto";
import type { ObservationFrame, ObservationEvent, ObservationBatch } from "@flowstream/types";

export class IPFSBatcher {
  private buffer: ObservationFrame[] = [];
  private events: ObservationEvent[] = [];
  private lastFlush = Date.now();

  constructor(
    private source: string,
    private contentType: string,
    private observer: string = "0x0000000000000000000000000000000000000000",
    private intervalMs: number = 30_000
  ) {}

  /** Add a frame to the current batch buffer */
  addFrame(frame: ObservationFrame): void {
    this.buffer.push(frame);
    for (const e of frame.events) {
      this.events.push(e);
    }
  }

  /** Check if enough time has passed and we have frames to flush */
  shouldFlush(): boolean {
    return Date.now() - this.lastFlush >= this.intervalMs && this.buffer.length > 0;
  }

  /**
   * Flush the current buffer as an ObservationBatch.
   *
   * @param state - Aggregate state at end of batch
   * @returns The mock CID and the batch object
   */
  async flush(state: {
    score: [number, number];
    elapsed: number;
    period: number;
    momentum: [number, number];
  }): Promise<{ cid: string; batch: ObservationBatch }> {
    const batch: ObservationBatch = {
      v: 1,
      observer: this.observer,
      source: this.source,
      contentType: this.contentType,
      chain: 5042002,
      fromTs: this.buffer[0]?.ts ?? Date.now(),
      toTs: this.buffer[this.buffer.length - 1]?.ts ?? Date.now(),
      frames: [...this.buffer],
      events: [...this.events],
      state,
    };

    // Generate mock CID from SHA-256 hash
    const json = JSON.stringify(batch);
    const hash = createHash("sha256").update(json).digest("hex");
    const cid = `baf_${hash.slice(0, 56)}`;

    console.log(
      `[ipfs] batch: ${this.buffer.length} frames, ${this.events.length} events -> ${cid.slice(0, 20)}...`
    );

    // Clear buffer
    this.buffer = [];
    this.events = [];
    this.lastFlush = Date.now();

    return { cid, batch };
  }

  /** Number of frames currently buffered */
  get bufferedFrames(): number {
    return this.buffer.length;
  }
}
