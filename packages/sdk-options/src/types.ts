/**
 * SDK-specific types for @flowstream/sdk-options.
 *
 * Re-exports shared types from @flowstream/types and defines
 * SDK-local types for client configuration, stream params, etc.
 */

import type { WalletClient, PublicClient, Chain, Transport, Account } from "viem";

// Re-export shared types consumers need
export type {
  VaultState,
  VaultSummary,
  VaultStatus,
  VaultOutcome,
  OptionType,
  HotSeverity,
  Position,
  ContractAddresses,
} from "@flowstream/types";

/** Configuration for creating a FlowStreamClient. */
export interface FlowStreamClientConfig {
  /** Contract addresses on Arc. */
  contracts: import("@flowstream/types").ContractAddresses;
  /** RPC URL (default: Arc testnet). */
  rpcUrl?: string;
  /**
   * Wallet client for write operations.
   * Pass a hex private key or a viem WalletClient.
   * Read-only mode if omitted.
   */
  wallet?: `0x${string}` | WalletClient<Transport, Chain, Account>;

  /**
   * Circle Gateway Nanopayment configuration (optional).
   *
   * When provided, enables gas-free sub-cent payments for accessing
   * observation feeds from stats providers. Consumers (bookmaker agents,
   * client apps) pay stats providers for their live CV data.
   *
   * This is NOT for vault streaming (that's on-chain via Vault.stream()).
   * Nanopayments power the observation data marketplace — paying per-access
   * for feeds, API queries, and observation batches.
   *
   * Requirements:
   *   - npm install @circle-fin/x402-batching
   *   - An EOA wallet private key (SCAs are NOT supported)
   *   - USDC deposited into Gateway (one-time onchain tx)
   */
  nanopay?: NanopayClientConfig;
}

/** Configuration for nanopayment-enabled observation feed access. */
export interface NanopayClientConfig {
  /** Private key for signing nanopayment authorizations (must be EOA) */
  privateKey: `0x${string}`;
  /** Chain for Gateway operations (default: "arcTestnet") */
  chain?: string;
}

/** Parameters for creating a new vault. */
export interface CreateVaultParams {
  /** Human-readable prediction text, e.g. "Next goal before 70'" */
  option: string;
  /** Option type category. */
  optionType: import("@flowstream/types").OptionType;
  /** Duration in seconds before vault expires. */
  duration: number;
  /** Initial creator stake in raw USDC (6 decimals). */
  stake: bigint;
  /** Which side the creator stakes on. */
  side: "yes" | "no";
}

/** Parameters for streaming USDC into a vault. */
export interface StreamParams {
  /** Vault ID to stream into. */
  vaultId: `0x${string}`;
  /** Which side to stream into. */
  side: "yes" | "no";
  /** Amount of USDC to stream in raw units (6 decimals). */
  amount: bigint;
}

/** Parameters for submitting a vault resolution. */
export interface ResolveParams {
  /** Vault ID to resolve. */
  vaultId: `0x${string}`;
  /** Resolution outcome. */
  outcome: "yes" | "no";
  /** IPFS CID of the proof (as bytes32 hex). */
  proofCid: `0x${string}`;
}

/** Result of a write transaction. */
export interface TxResult {
  txHash: `0x${string}`;
}

/** Result of vault creation. */
export interface CreateVaultResult {
  vaultId: `0x${string}`;
  txHash: `0x${string}`;
}

/** Aggregated FLOW balance info. */
export interface FlowBalanceInfo {
  balance: bigint;
  staked: bigint;
  pendingDividends: bigint;
}

/** Protocol-level state summary. */
export interface ProtocolState {
  lpTotal: bigint;
  surplus: bigint;
  flowSupply: bigint;
  flowStaked: bigint;
}

/** Bonding curve price calculation parameters. */
export interface PriceParams {
  basePrice: bigint;
  yesTotal: bigint;
  noTotal: bigint;
  yesCurveK: bigint;
  noCurveK: bigint;
  createdAt: number;
  expiresAt: number;
  hotMultiplier: number;
}
