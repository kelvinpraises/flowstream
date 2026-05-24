/**
 * MomentumDetector — detects sustained momentum shifts.
 *
 * Content-agnostic: monitors the `momentum` field (0-100).
 * Works for football possession, esports gold lead %, debate
 * speaking time %, etc.
 *
 * Logic:
 *   1. Compute average momentum over the recent window.
 *   2. If one side sustains > threshold (default 65) for at least
 *      `minFrames` frames AND score_change events favour that side,
 *      emit a detection.
 *   3. The favoured side is predicted to score / advance next.
 *      Agent stakes on YES ("Side N scores/advances next").
 */

import type { ObservationFrame } from "@flowstream/types";
import type { PatternDetector, DetectionResult } from "./detector.js";

export interface MomentumDetectorOptions {
  /** Momentum threshold to trigger detection (default: 65) */
  threshold?: number;
  /** Minimum consecutive frames above threshold (default: 30 = ~6s at 5fps) */
  minFrames?: number;
  /** Default stake in raw USDC units (default: 10_000_000n = 10 USDC) */
  defaultStake?: bigint;
}

export class MomentumDetector implements PatternDetector {
  readonly name = "momentum";

  private readonly threshold: number;
  private readonly minFrames: number;
  private readonly defaultStake: bigint;

  constructor(options?: MomentumDetectorOptions) {
    this.threshold = options?.threshold ?? 65;
    this.minFrames = options?.minFrames ?? 30;
    this.defaultStake = options?.defaultStake ?? 10_000_000n;
  }

  detect(buffer: ObservationFrame[]): DetectionResult | null {
    if (buffer.length < this.minFrames) return null;

    // Analyse the tail of the buffer
    const window = buffer.slice(-this.minFrames);

    // Side 0 momentum = momentum field directly (0-100, >50 favours side 0)
    // Side 1 momentum = 100 - momentum
    const avgMomentum =
      window.reduce((sum, f) => sum + f.momentum, 0) / window.length;

    // Determine which side is dominant and whether it clears the threshold
    let dominantSide: 0 | 1;
    let effectiveMomentum: number;

    if (avgMomentum >= this.threshold) {
      dominantSide = 0;
      effectiveMomentum = avgMomentum;
    } else if (100 - avgMomentum >= this.threshold) {
      dominantSide = 1;
      effectiveMomentum = 100 - avgMomentum;
    } else {
      return null; // Neither side dominates
    }

    // Check that every frame in the window stays above threshold for that side
    const sustained = window.every((f) => {
      const sideMomentum = dominantSide === 0 ? f.momentum : 100 - f.momentum;
      return sideMomentum >= this.threshold;
    });
    if (!sustained) return null;

    // Count score_change events in the full buffer favouring the dominant side
    const recentScoreEvents = buffer.filter(
      (f) =>
        f.events.some(
          (e) => e.type === "score_change" && e.side === dominantSide
        )
    ).length;

    // Boost confidence when score events align with momentum
    const baseConfidence = 0.5 + (effectiveMomentum - this.threshold) / 100;
    const eventBoost = Math.min(recentScoreEvents * 0.05, 0.15);
    const confidence = Math.min(baseConfidence + eventBoost, 0.95);

    if (confidence < 0.6) return null;

    return {
      option: `Side ${dominantSide} scores next`,
      optionType: "momentum",
      confidence,
      duration: 300, // 5 minutes
      side: "yes",
      stake: this.defaultStake,
      detectorName: this.name,
    };
  }
}
