/**
 * MockAdapter — generates synthetic observation data for development.
 *
 * No external dependencies. Works immediately.
 * Produces frames that mimic a football match:
 * - Ball moves in smooth parametric curves across the pitch
 * - Goals happen periodically (~every 90 seconds)
 * - Momentum shifts naturally based on ball position
 *
 * Migrated from drafts/sdk-stats/app/src/mock.ts + events.ts.
 * Maps football-specific fields to content-agnostic ObservationFrame:
 * - ball -> primaryPosition
 * - possession -> momentum
 * - min -> elapsed
 * - goal event -> score_change event type
 */

import type { ContentAdapter } from "./adapter.js";
import type { ObservationFrame, ObservationEvent, EventType } from "@flowstream/types";

const GOAL_X = 52.5;
const GOAL_POST_Y = 3.66; // half goal width

export class MockAdapter implements ContentAdapter {
  readonly contentType = "football";
  readonly displayName = "Mock Football";

  // Movement parameters — multiple frequencies for realism
  private phaseX = Math.random() * Math.PI * 2;
  private phaseY = Math.random() * Math.PI * 2;

  // Match state
  private score: [number, number] = [0, 0];
  private lastGoalFrame = -100;
  private homeFrames = 0;
  private totalFrames = 0;

  async initialize(_source: string, _fps: number): Promise<void> {
    // No-op for mock — no models to load, no connections to make
  }

  async processFrame(frameId: number, elapsedMs: number): Promise<ObservationFrame> {
    const t = elapsedMs / 1000;
    const events: ObservationEvent[] = [];

    // Composite sine curves for smooth, realistic-looking ball movement
    let x =
      35 * Math.sin(0.25 * t + this.phaseX) +
      10 * Math.sin(0.7 * t) +
      5 * Math.cos(1.3 * t);
    let y =
      20 * Math.sin(0.4 * t + this.phaseY) +
      8 * Math.cos(0.9 * t) +
      3 * Math.sin(1.6 * t);

    // Clamp to pitch bounds
    x = Math.max(-52, Math.min(52, x));
    y = Math.max(-33.5, Math.min(33.5, y));

    // Goal trigger: roughly every 90 seconds, force ball to goal line
    const goalCycle = Math.floor(t / 90);
    const goalWindow = t % 90;
    if (goalWindow > 88 && goalWindow < 89) {
      const side = goalCycle % 2 === 0 ? 1 : -1;
      x = side * 52.5;
      y = (Math.random() - 0.5) * 6; // within goal posts
    }

    const ballX = Math.round(x * 10) / 10;
    const ballY = Math.round(y * 10) / 10;

    // Goal detection (debounce: no two goals within 50 frames)
    if (frameId - this.lastGoalFrame >= 50 && Math.abs(ballY) <= GOAL_POST_Y) {
      if (ballX >= GOAL_X) {
        // Ball at away goal -> home scored
        this.score[0]++;
        this.lastGoalFrame = frameId;
        events.push({
          type: "score_change",
          side: 0,
          at: Math.floor(t / 60),
          data: { originalType: "goal" },
        });
      } else if (ballX <= -GOAL_X) {
        // Ball at home goal -> away scored
        this.score[1]++;
        this.lastGoalFrame = frameId;
        events.push({
          type: "score_change",
          side: 1,
          at: Math.floor(t / 60),
          data: { originalType: "goal" },
        });
      }
    }

    // Momentum tracking: possession based on which half the ball is in
    this.totalFrames++;
    if (x > 0) this.homeFrames++;
    const momentum = this.totalFrames > 0
      ? Math.round((100 * this.homeFrames) / this.totalFrames)
      : 50;

    const elapsed = Math.floor(t / 60);

    return {
      frame: frameId,
      ts: Date.now(),
      contentType: "football",
      primaryPosition: [ballX, ballY],
      momentum,
      events,
      score: [...this.score] as [number, number],
      elapsed,
      period: elapsed >= 45 ? 2 : 1,
      meta: {
        ballVelocity: [0, 0],
      },
    };
  }

  async destroy(): Promise<void> {
    // No-op for mock — nothing to clean up
  }
}
