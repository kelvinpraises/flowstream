/**
 * Pattern detection registry and re-exports.
 */

export type { PatternDetector, DetectionResult } from "./detector.js";
export { MomentumDetector } from "./momentum.js";
export type { MomentumDetectorOptions } from "./momentum.js";
export { ThresholdDetector } from "./threshold.js";
export type { ThresholdDetectorOptions } from "./threshold.js";
export { PerformanceDetector } from "./performance.js";
export type { PerformanceDetectorOptions } from "./performance.js";

import type { PatternDetector } from "./detector.js";
import { MomentumDetector } from "./momentum.js";
import { ThresholdDetector } from "./threshold.js";
import { PerformanceDetector } from "./performance.js";

/**
 * Create all built-in pattern detectors with default configuration.
 *
 * Used by BookmakerAgent when no custom detectors are provided.
 */
export function createDefaultDetectors(): PatternDetector[] {
  return [
    new MomentumDetector(),
    new ThresholdDetector(),
    new PerformanceDetector(),
  ];
}
