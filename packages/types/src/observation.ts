/**
 * Observation types — the normalized frame schema.
 *
 * Content-agnostic. Every adapter produces ObservationFrames.
 * Every consumer reads ObservationFrames.
 */

/**
 * A single observation frame. Content-agnostic.
 *
 * The `entities` concept is captured through `primaryPosition` and `meta`.
 * For football: primaryPosition is ball, meta has players.
 * For esports: primaryPosition may be null, meta has champions.
 * For debates: primaryPosition may be null, meta has speakers.
 *
 * The `contentType` field tells consumers what adapter produced this.
 * The frame schema is the SAME regardless of content type.
 */
export interface ObservationFrame {
  /** Monotonically increasing frame counter */
  frame: number;
  /** Unix timestamp in milliseconds */
  ts: number;
  /** Content type identifier (e.g., "football", "esports", "debate") */
  contentType: string;
  /**
   * Primary tracked position [x, y] in normalized coordinates.
   * Coordinate system is content-defined but always 2D.
   * Football: pitch center = [0,0], x: -52.5..52.5, y: -34..34
   * Other content types define their own coordinate systems.
   */
  primaryPosition: [number, number] | null;
  /**
   * Aggregate metric 0-100 representing balance/momentum.
   * Football: possession %. Debate: speaking time %. Esports: gold lead %.
   */
  momentum: number;
  /** Events detected in this frame */
  events: ObservationEvent[];
  /**
   * Cumulative score/tally. Interpretation is content-specific.
   * Football: [home goals, away goals]. Debate: [pointsA, pointsB].
   */
  score: [number, number];
  /** Elapsed time unit. Football: match minute. Esports: game time. */
  elapsed: number;
  /** Period/phase. Football: 1=first half, 2=second half. */
  period: number;
  /**
   * Content-specific metadata. Adapters put domain data here.
   * Football adapter: { players: [...], formations: [...] }
   * Debate adapter: { speakers: [...], topics: [...] }
   */
  meta?: Record<string, unknown>;
}

/**
 * An event detected during observation.
 * Generic event types that work across all content verticals.
 */
export interface ObservationEvent {
  /** Event type. Content-agnostic categories. */
  type: EventType;
  /** Which side/team (0 or 1). For 2-sided content. */
  side: 0 | 1;
  /** When it happened (elapsed time units) */
  at: number;
  /** Content-specific event data */
  data?: Record<string, unknown>;
}

/**
 * Content-agnostic event types.
 *
 * These map to different domain events per content type:
 * - score_change: goal (football), kill (esports), point awarded (debate)
 * - action: shot/foul (football), ability used (esports), rebuttal (debate)
 * - violation: card/offside (football), penalty (esports), rule break (debate)
 * - momentum_shift: possession_change (football), team fight win (esports)
 * - phase_change: half time (football), round end (esports), topic change (debate)
 * - participant_change: substitution (football), disconnect (esports)
 */
export type EventType =
  | "score_change"
  | "action"
  | "violation"
  | "momentum_shift"
  | "phase_change"
  | "participant_change";

/**
 * IPFS observation batch. Aggregates frames for permanent storage.
 */
export interface ObservationBatch {
  /** Schema version */
  v: 1;
  /** Observer wallet address */
  observer: string;
  /** Video source identifier */
  source: string;
  /** Content type */
  contentType: string;
  /** Chain ID (5042002 for Arc testnet) */
  chain: number;
  /** Batch time range */
  fromTs: number;
  toTs: number;
  /** All frames in this batch */
  frames: ObservationFrame[];
  /** Deduplicated events in this window */
  events: ObservationEvent[];
  /** Aggregate state at end of batch */
  state: {
    score: [number, number];
    elapsed: number;
    period: number;
    momentum: [number, number];
  };
}
