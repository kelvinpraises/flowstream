/**
 * PerformanceDetector — detects trending entity/side performance.
 *
 * Content-agnostic: tracks `events` of type "action" per side.
 * When one side generates significantly more actions than the other,
 * that side is "trending" and likely to produce the next score event.
 *
 * Works for football shots, esports abilities/kills, debate rebuttals, etc.
 *
 * Logic:
 *   1. Count action events per side across the buffer window.
 *   2. If one side has >= `dominanceRatio` more actions, detect.
 *   3. Higher dominance ratio = higher confidence.
 *   4. Agent stakes YES on "Side N trending performance".
 */

import type { ObservationFrame } from "@flowstream/types";
import type { PatternDetector, DetectionResult } from "./detector.js";

export interface PerformanceDetectorOptions {
  /** Minimum action events needed to consider (default: 4) */
  minActions?: number;
  /** Ratio of dominant side actions / weaker side actions to trigger (default: 2.0) */
  dominanceRatio?: number;
  /** Default stake in raw USDC units (default: 10_000_000n = 10 USDC) */
  defaultStake?: bigint;
}

export class PerformanceDetector implements PatternDetector {
  readonly name = "performance";

  private readonly minActions: number;
  private readonly dominanceRatio: number;
  private readonly defaultStake: bigint;

  constructor(options?: PerformanceDetectorOptions) {
    this.minActions = options?.minActions ?? 4;
    this.dominanceRatio = options?.dominanceRatio ?? 2.0;
    this.defaultStake = options?.defaultStake ?? 10_000_000n;
  }

  detect(buffer: ObservationFrame[]): DetectionResult | null {
    if (buffer.length < 10) return null;

    // Count action events per side across the entire buffer
    const actionCounts: [number, number] = [0, 0];

    for (const frame of buffer) {
      for (const event of frame.events) {
        if (event.type === "action") {
          actionCounts[event.side]++;
        }
      }
    }

    const total = actionCounts[0] + actionCounts[1];
    if (total < this.minActions) return null;

    // Determine dominant side
    let dominantSide: 0 | 1;
    let ratio: number;

    if (actionCounts[0] >= actionCounts[1]) {
      dominantSide = 0;
      ratio =
        actionCounts[1] > 0
          ? actionCounts[0] / actionCounts[1]
          : actionCounts[0] > 0
            ? Infinity
            : 0;
    } else {
      dominantSide = 1;
      ratio =
        actionCounts[0] > 0
          ? actionCounts[1] / actionCounts[0]
          : actionCounts[1] > 0
            ? Infinity
            : 0;
    }

    if (ratio < this.dominanceRatio) return null;

    // Confidence scales with how extreme the dominance is
    const confidence = Math.min(0.5 + (ratio - this.dominanceRatio) * 0.1, 0.9);
    if (confidence < 0.6) return null;

    return {
      option: `Side ${dominantSide} trending performance`,
      optionType: "performance",
      confidence,
      duration: 300, // 5 minutes
      side: "yes",
      stake: this.defaultStake,
      detectorName: this.name,
    };
  }
}
