/**
 * Content-agnostic event detection from observation frames.
 *
 * Migrated from drafts/sdk-stats/app/src/events.ts.
 * The original EventDetector was football-specific (goal line detection,
 * possession tracking). This version works with content-agnostic
 * ObservationFrames — it tracks aggregate state across frames
 * and detects cross-frame events like momentum shifts.
 *
 * Content-specific event detection (goals, kills, etc.) happens
 * INSIDE adapters. This module detects higher-order patterns
 * from the normalized frame data.
 */

import type { ObservationFrame, ObservationEvent } from "@flowstream/types";

/** Aggregate match state tracked across frames */
export interface AggregateState {
  score: [number, number];
  elapsed: number;
  period: number;
  /** Running momentum values: [sideA cumulative, total frames] */
  momentumAccumulator: [number, number];
  /** Current momentum percentage for side 0 */
  momentum: number;
}

export class EventDetector {
  state: AggregateState = {
    score: [0, 0],
    elapsed: 0,
    period: 1,
    momentumAccumulator: [0, 0],
    momentum: 50,
  };

  private lastMomentumShiftFrame = -100;

  /**
   * Process a frame and detect any cross-frame events.
   * Updates internal aggregate state.
   *
   * @returns Additional events detected from frame analysis
   *          (these are ADDED to the adapter's own events)
   */
  processFrame(frame: ObservationFrame): ObservationEvent[] {
    const additionalEvents: ObservationEvent[] = [];

    // Update aggregate state from frame
    this.state.elapsed = frame.elapsed;
    this.state.period = frame.period;
    this.state.score = [...frame.score] as [number, number];

    // Track momentum accumulator
    this.state.momentumAccumulator[1]++;
    if (frame.momentum > 50) {
      this.state.momentumAccumulator[0]++;
    }
    this.state.momentum = frame.momentum;

    // Detect momentum shifts (significant change in momentum direction)
    const prevMomentum = this.state.momentumAccumulator[1] > 1
      ? Math.round((100 * this.state.momentumAccumulator[0]) / (this.state.momentumAccumulator[1] - 1))
      : 50;
    const currentMomentum = frame.momentum;

    // If momentum swings more than 20 points and we haven't flagged recently
    if (
      Math.abs(currentMomentum - prevMomentum) > 20 &&
      frame.frame - this.lastMomentumShiftFrame > 100
    ) {
      this.lastMomentumShiftFrame = frame.frame;
      additionalEvents.push({
        type: "momentum_shift",
        side: currentMomentum > 50 ? 0 : 1,
        at: frame.elapsed,
        data: {
          from: prevMomentum,
          to: currentMomentum,
        },
      });
    }

    return additionalEvents;
  }

  /** Reset state (e.g., between matches) */
  reset(): void {
    this.state = {
      score: [0, 0],
      elapsed: 0,
      period: 1,
      momentumAccumulator: [0, 0],
      momentum: 50,
    };
    this.lastMomentumShiftFrame = -100;
  }
}
