/**
 * Steward SDK error classes.
 *
 * Extends FlowStreamError from @flowstream/types.
 * Follows viem's approach: typed errors with metadata.
 */

import { FlowStreamError, ProposalError } from "@flowstream/types";

// Re-export the shared ProposalError for convenience
export { ProposalError };

/** Error thrown when steward registration fails */
export class RegistrationError extends FlowStreamError {
  override name = "RegistrationError";
}

/** Error thrown when a monitoring operation fails */
export class MonitoringError extends FlowStreamError {
  override name = "MonitoringError";
}

/** Error thrown when a challenge operation fails */
export class ChallengeError extends FlowStreamError {
  override name = "ChallengeError";
}

/** Error thrown when a veto operation fails (e.g., not in-house, limit reached) */
export class VetoError extends FlowStreamError {
  override name = "VetoError";
}

/** Error thrown when a resolution operation fails */
export class ResolutionError extends FlowStreamError {
  override name = "ResolutionError";
}

/** Error thrown when staking operations fail */
export class StakingError extends FlowStreamError {
  override name = "StakingError";
}

/** Error thrown when the observation feed is unavailable */
export class FeedError extends FlowStreamError {
  override name = "FeedError";
}
