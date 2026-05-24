/**
 * @flowstream/sdk-steward — Protocol governance agents.
 *
 * Main entry point. Exports the StewardAgent class and all public types.
 *
 * Usage:
 * ```ts
 * import { StewardAgent } from "@flowstream/sdk-steward";
 *
 * const agent = new StewardAgent({
 *   feedUrl: "ws://localhost:8765",
 *   wallet: "0x...",
 *   contracts: { vault: "0x...", steward: "0x...", ... },
 *   name: "Guardian1",
 * });
 *
 * await agent.register("community");
 * await agent.start();
 * ```
 */

// Main client class
export { StewardAgent } from "./client.js";

// Types (SDK-specific + re-exported shared types)
export type {
  StewardAgentConfig,
  ProposalResult,
  VaultHealthReport,
  VaultHealthFlag,
  MonitoringRule,
  AgentTrackRecord,
  PendingResolution,
} from "./types.js";

// Re-export key shared types for convenience
export type {
  StewardInfo,
  Proposal,
  StewardTier,
  ActionType,
  ProposalStatus,
  VaultState,
  ContractAddresses,
} from "./types.js";

// Errors
export {
  ProposalError,
  RegistrationError,
  MonitoringError,
  ChallengeError,
  VetoError,
  ResolutionError,
  StakingError,
  FeedError,
} from "./errors.js";

// Sub-modules (named exports for advanced usage)
export { VaultHealthMonitor } from "./monitoring/index.js";
export { ResolutionWatcher } from "./monitoring/index.js";
export { AgentTracker } from "./monitoring/index.js";

export { ProposalManager } from "./governance/index.js";
export { ChallengeManager } from "./governance/index.js";
export { ResolutionManager } from "./governance/index.js";

export { FlowStaking } from "./staking/index.js";
export type { FlowBalance } from "./staking/index.js";

// Circle Agent Wallet integration
export { CircleAgentWallet } from "./wallet/agent-wallet.js";
export type {
  CircleAgentWalletConfig,
  CircleExecuteResult,
  CircleTransferResult,
} from "./wallet/agent-wallet.js";
