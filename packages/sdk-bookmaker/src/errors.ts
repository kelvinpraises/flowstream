/**
 * Bookmaker-specific errors.
 *
 * Extends the shared AgentError from @flowstream/types.
 */

import { AgentError } from "@flowstream/types";

// Re-export the base so consumers only need this package
export { AgentError };

/** Raised when the observation feed WebSocket cannot connect or drops */
export class FeedConnectionError extends AgentError {
  override name = "FeedConnectionError";

  constructor(url: string, args?: { cause?: Error; details?: string }) {
    super(`Failed to connect to observation feed at ${url}`, {
      ...args,
      docsPath: "/sdk-bookmaker/feed",
    });
  }
}

/** Raised when vault creation fails on-chain */
export class VaultCreationError extends AgentError {
  override name = "VaultCreationError";

  constructor(reason: string, args?: { cause?: Error; details?: string }) {
    super(`Vault creation failed: ${reason}`, {
      ...args,
      docsPath: "/sdk-bookmaker/vault",
    });
  }
}

/** Raised when ERC-8004 identity registration fails */
export class RegistrationError extends AgentError {
  override name = "RegistrationError";

  constructor(reason: string, args?: { cause?: Error; details?: string }) {
    super(`Agent registration failed: ${reason}`, {
      ...args,
      docsPath: "/sdk-bookmaker/identity",
    });
  }
}

/** Raised when the agent is already running or already stopped */
export class AgentLifecycleError extends AgentError {
  override name = "AgentLifecycleError";
}
