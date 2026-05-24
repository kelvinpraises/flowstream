/**
 * SDK-specific types for the steward agent.
 *
 * Re-exports shared types from @flowstream/types and defines
 * steward-specific configuration and monitoring types.
 */

import type { WalletClient } from "viem";
import type {
  ContractAddresses,
  StewardTier,
  VaultState,
  ObservationFrame,
  ObservationEvent,
} from "@flowstream/types";
import type { CircleAgentWalletConfig } from "./wallet/agent-wallet.js";

// Re-export shared steward types for convenience
export type {
  StewardInfo,
  Proposal,
  StewardTier,
  ActionType,
  ProposalStatus,
} from "@flowstream/types";

export type {
  VaultState,
  VaultStatus,
  VaultOutcome,
  VaultSummary,
  Position,
} from "@flowstream/types";

export type {
  AgentIdentity,
  AgentReputation,
} from "@flowstream/types";

export type { ContractAddresses } from "@flowstream/types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface StewardAgentConfig {
  /** WebSocket URL of the observation feed */
  feedUrl: string;
  /** Steward's private key or wallet instance */
  wallet: `0x${string}` | WalletClient;
  /** Contract addresses on Arc */
  contracts: ContractAddresses;
  /** RPC URL (default: Arc testnet) */
  rpcUrl?: string;
  /** Steward name for on-chain registration */
  name: string;
  /** Steward tier (default: "community") */
  tier?: StewardTier;
  /** Monitoring check interval in ms (default: 30000) */
  checkInterval?: number;
  /** Auto-submit resolutions when detected (default: false) */
  autoResolve?: boolean;
  /** Auto-challenge suspicious resolutions (default: false) */
  autoChallenge?: boolean;

  /**
   * Circle Agent Wallet configuration (optional).
   *
   * When provided, the steward uses Circle's gas-sponsored Agent Wallet
   * for governance transactions (proposals, challenges, resolutions).
   *
   * Benefits:
   *   - Zero gas costs (sponsored by Circle)
   *   - Built-in compliance controls and spending policies
   *   - 2-of-2 MPC key management (user retains custody)
   *
   * Prerequisites:
   *   1. Install Circle CLI: npm install -g @circle-fin/cli
   *   2. Authenticate: circle wallet login <email> --testnet
   *   3. Fund the wallet with testnet USDC from faucet.circle.com
   */
  circleWallet?: CircleAgentWalletConfig;
}

// ---------------------------------------------------------------------------
// Monitoring types
// ---------------------------------------------------------------------------

/** Health flags for a vault under monitoring */
export type VaultHealthFlag =
  | "expired_challenge"
  | "disputed"
  | "hot_active"
  | "asymmetric_pool"
  | "thin_liquidity"
  | "pending_finalization"
  | "expired_unresolved";

/** A vault health report produced by the monitoring loop */
export interface VaultHealthReport {
  vaultId: `0x${string}`;
  vault: VaultState;
  flags: VaultHealthFlag[];
  /** Ratio of yesTotal to noTotal (> 1 means YES-heavy) */
  poolRatio: number;
  /** Seconds until the challenge window expires (negative = already expired) */
  challengeWindowRemaining: number;
  /** Seconds until the vault expires (negative = already expired) */
  expiryRemaining: number;
}

/** Rule that triggers a monitoring action */
export interface MonitoringRule {
  /** Rule identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Check function returning true if the rule fires */
  check: (vault: VaultState, frames: ObservationFrame[]) => boolean;
  /** Action to take when rule fires */
  action: "propose_boost" | "propose_slash" | "challenge" | "alert";
}

// ---------------------------------------------------------------------------
// Proposal results
// ---------------------------------------------------------------------------

export interface ProposalResult {
  proposalId: number;
  txHash: `0x${string}`;
}

// ---------------------------------------------------------------------------
// Agent tracking
// ---------------------------------------------------------------------------

export interface AgentTrackRecord {
  address: `0x${string}`;
  vaultsCreated: number;
  correctResolutions: number;
  incorrectResolutions: number;
  /** Accuracy as a number between 0 and 1 */
  accuracy: number;
  /** Whether the agent appears to be acting in bad faith */
  suspicious: boolean;
}

// ---------------------------------------------------------------------------
// Resolution tracking
// ---------------------------------------------------------------------------

export interface PendingResolution {
  vaultId: `0x${string}`;
  outcome: "yes" | "no";
  proofCid: `0x${string}`;
  resolver: `0x${string}`;
  challengeUntil: number;
  /** Whether our own observations agree with the submitted proof */
  observationMatch: boolean | null;
}
