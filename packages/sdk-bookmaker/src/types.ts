/**
 * SDK-specific types for the bookmaker agent.
 *
 * Re-exports shared types from @flowstream/types for convenience,
 * plus defines bookmaker-specific configuration and detection types.
 */

import type { WalletClient } from "viem";
import type {
  ObservationFrame,
  ContractAddresses,
  OptionType,
  AgentReputation,
} from "@flowstream/types";
import type { CircleAgentWalletConfig } from "./wallet/agent-wallet.js";

// Re-export shared types that consumers commonly need
export type {
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
} from "@flowstream/types";

// ---------------------------------------------------------------------------
// Bookmaker Agent Configuration
// ---------------------------------------------------------------------------

export interface BookmakerAgentConfig {
  /** WebSocket URL of the observation feed (e.g. "ws://localhost:8765") */
  feedUrl: string;

  /** Agent's private key (hex) or a pre-configured viem WalletClient */
  wallet: `0x${string}` | WalletClient;

  /** Contract addresses on Arc */
  contracts: ContractAddresses;

  /** RPC URL (default: Arc testnet) */
  rpcUrl?: string;

  /** Pattern detectors to run. When omitted all built-in detectors are used. */
  detectors?: PatternDetector[];

  /** Detection check interval in milliseconds (default: 10 000) */
  checkInterval?: number;

  /** Default USDC stake per vault in raw 6-decimal units (default: 10 USDC = 10_000_000n) */
  defaultStake?: bigint;

  /** Agent display name for ERC-8004 registration */
  name: string;

  /** How many minutes of frames to buffer (default: 5) */
  bufferMinutes?: number;

  /** Minimum confidence to create a vault (default: 0.6) */
  confidenceThreshold?: number;

  /**
   * Circle Agent Wallet configuration (optional).
   *
   * When provided, the agent uses Circle's gas-sponsored Agent Wallet
   * for all on-chain operations instead of the raw viem wallet.
   *
   * Benefits:
   *   - Zero gas costs (sponsored by Circle)
   *   - Built-in spending policies and compliance controls
   *   - 2-of-2 MPC key management (user retains custody)
   *   - Supports Arc Testnet and all other Circle-supported chains
   *
   * Prerequisites:
   *   1. Install Circle CLI: npm install -g @circle-fin/cli
   *   2. Authenticate: circle wallet login <email> --testnet
   *   3. Fund the wallet with testnet USDC from faucet.circle.com
   *
   * When circleWallet is set, the `wallet` field is still required
   * as a fallback for read operations (e.g. reading on-chain state).
   */
  circleWallet?: CircleAgentWalletConfig;
}

// ---------------------------------------------------------------------------
// Pattern Detection
// ---------------------------------------------------------------------------

/**
 * Content-agnostic pattern detector interface.
 *
 * Implementations analyse a sliding window of ObservationFrames and
 * return a DetectionResult when they spot an opportunity. The bookmaker
 * agent invokes every registered detector on each check interval.
 */
export interface PatternDetector {
  /** Human-readable detector name (used in logs and vault metadata) */
  readonly name: string;

  /**
   * Analyse buffered frames and optionally return a detection.
   *
   * @param buffer - Recent observation frames, oldest first.
   * @returns A DetectionResult when a pattern is detected, or `null`.
   */
  detect(buffer: ObservationFrame[]): DetectionResult | null;
}

/**
 * The output of a successful pattern detection.
 *
 * Contains everything the agent needs to create a vault.
 */
export interface DetectionResult {
  /** The prediction option text (e.g. "Side 0 scores next") */
  option: string;

  /** Which situational option type this maps to */
  optionType: OptionType;

  /** Confidence score 0-1 */
  confidence: number;

  /** Suggested vault duration in seconds */
  duration: number;

  /** Which side the agent stakes on */
  side: "yes" | "no";

  /** Suggested stake in raw USDC units (6 decimals) */
  stake: bigint;

  /** Detector name that produced this result */
  detectorName: string;
}

// ---------------------------------------------------------------------------
// Agent Events (typed callback signatures)
// ---------------------------------------------------------------------------

export interface BookmakerAgentEvents {
  /** Emitted for every incoming observation frame */
  onFrame?: (frame: ObservationFrame) => void;

  /** Emitted when a detector finds a pattern */
  onDetection?: (result: DetectionResult) => void;

  /** Emitted after a vault is successfully created on-chain */
  onVaultCreated?: (vaultId: `0x${string}`, result: DetectionResult) => void;

  /** Emitted on any non-fatal error during the agent loop */
  onError?: (error: Error) => void;
}
