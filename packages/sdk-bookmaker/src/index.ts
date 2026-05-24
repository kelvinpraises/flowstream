/**
 * @flowstream/sdk-bookmaker — Autonomous Market-Making Agents
 *
 * Enables AI agents to watch observation streams, detect patterns,
 * and create prediction vaults with their own capital.
 *
 * @example
 * ```ts
 * import { BookmakerAgent } from "@flowstream/sdk-bookmaker";
 *
 * const agent = new BookmakerAgent({
 *   feedUrl: "ws://localhost:8765",
 *   wallet: "0x...",
 *   contracts: { vault: "0x...", ... },
 *   name: "MomentumBot",
 * });
 *
 * agent.onDetection((result) => {
 *   console.log(`Detected: ${result.option} (${result.confidence})`);
 * });
 *
 * await agent.register();
 * await agent.start();
 * ```
 */

// Main client class
export { BookmakerAgent } from "./client.js";

// Types (re-export shared + SDK-specific)
export type {
  BookmakerAgentConfig,
  BookmakerAgentEvents,
  PatternDetector,
  DetectionResult,
  ObservationFrame,
  ObservationEvent,
  EventType,
  ContractAddresses,
  OptionType,
  VaultState,
  VaultSummary,
  Position,
  AgentIdentity,
  AgentReputation,
} from "./types.js";

// Errors
export {
  AgentError,
  FeedConnectionError,
  VaultCreationError,
  RegistrationError,
  AgentLifecycleError,
} from "./errors.js";

// Pattern detectors
export {
  MomentumDetector,
  ThresholdDetector,
  PerformanceDetector,
  createDefaultDetectors,
} from "./patterns/index.js";
export type {
  MomentumDetectorOptions,
  ThresholdDetectorOptions,
  PerformanceDetectorOptions,
} from "./patterns/index.js";

// Vault operations
export { VaultCreator } from "./vault/index.js";
export type { CreateVaultParams, CreateVaultResult } from "./vault/index.js";
export { PositionManager } from "./vault/index.js";
export type { ActivePosition } from "./vault/index.js";

// Feed consumer
export { ObservationConsumer } from "./feed/index.js";
export type { ObservationConsumerOptions } from "./feed/index.js";

// Identity
export { AgentIdentityRegistry } from "./identity/index.js";

// Circle Agent Wallet integration
export { CircleAgentWallet } from "./wallet/agent-wallet.js";
export type {
  CircleAgentWalletConfig,
  CircleExecuteResult,
  CircleTransferResult,
  CircleWalletInfo,
  CircleBalanceInfo,
} from "./wallet/agent-wallet.js";

// Utilities
export { usdcToRaw, rawToUsdc, formatUsdc } from "./utils/index.js";
