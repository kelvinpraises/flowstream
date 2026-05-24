/**
 * ThresholdDetector — projects pace from current score rate.
 *
 * Content-agnostic: uses `score` field changes over time windows
 * to project whether total events will exceed a threshold by a
 * certain elapsed time.
 *
 * Works for football goals, esports kills, debate points, etc.
 *
 * Logic:
 *   1. Compute the scoring rate (total score change per elapsed unit).
 *   2. Project forward to a target elapsed time.
 *   3. If the projected total exceeds a threshold, emit detection.
 *   4. Agent stakes on YES ("Total events over X by time Y").
 */

import type { ObservationFrame } from "@flowstream/types";
import type { PatternDetector, DetectionResult } from "./detector.js";

export interface ThresholdDetectorOptions {
  /** Minimum elapsed time units to have data for (default: 10) */
  minElapsed?: number;
  /** Target elapsed time for projection (default: 90 for football minutes) */
  targetElapsed?: number;
  /** Score total threshold to trigger (default: 3) */
  scoreThreshold?: number;
  /** Default stake in raw USDC units (default: 10_000_000n = 10 USDC) */
  defaultStake?: bigint;
}

export class ThresholdDetector implements PatternDetector {
  readonly name = "threshold";

  private readonly minElapsed: number;
  private readonly targetElapsed: number;
  private readonly scoreThreshold: number;
  private readonly defaultStake: bigint;

  constructor(options?: ThresholdDetectorOptions) {
    this.minElapsed = options?.minElapsed ?? 10;
    this.targetElapsed = options?.targetElapsed ?? 90;
    this.scoreThreshold = options?.scoreThreshold ?? 3;
    this.defaultStake = options?.defaultStake ?? 10_000_000n;
  }

  detect(buffer: ObservationFrame[]): DetectionResult | null {
    if (buffer.length < 2) return null;

    const first = buffer[0];
    const last = buffer[buffer.length - 1];

    const elapsedSpan = last.elapsed - first.elapsed;
    if (elapsedSpan < this.minElapsed) return null;

    // Total score across both sides
    const firstTotal = first.score[0] + first.score[1];
    const lastTotal = last.score[0] + last.score[1];
    const scoreChange = lastTotal - firstTotal;

    // Scoring rate per elapsed unit
    const rate = scoreChange / elapsedSpan;

    // Project to target elapsed
    const remainingElapsed = this.targetElapsed - last.elapsed;
    if (remainingElapsed <= 0) return null; // Already past target

    const projectedAdditional = rate * remainingElapsed;
    const projectedTotal = lastTotal + projectedAdditional;

    if (projectedTotal <= this.scoreThreshold) return null;

    // Confidence based on how far over the threshold we project
    const overshoot = projectedTotal - this.scoreThreshold;
    const confidence = Math.min(0.5 + overshoot * 0.1, 0.9);

    if (confidence < 0.6) return null;

    // Determine which side to bet: YES = over threshold will happen
    return {
      option: `Total events over ${this.scoreThreshold} by elapsed ${this.targetElapsed}`,
      optionType: "threshold",
      confidence,
      duration: Math.max(remainingElapsed * 60, 120), // Convert to seconds, min 2 min
      side: "yes",
      stake: this.defaultStake,
      detectorName: this.name,
    };
  }
}
