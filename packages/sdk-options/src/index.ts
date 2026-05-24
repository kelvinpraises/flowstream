/**
 * @flowstream/sdk-options — Consumer-facing vault interaction SDK.
 *
 * The primary entry point for React frontends and any consumer
 * that needs to interact with FlowStream vaults, stream USDC,
 * and manage FLOW staking.
 *
 * @example
 * ```ts
 * import { FlowStreamClient, formatUSDC, parseUSDC } from "@flowstream/sdk-options";
 *
 * const client = new FlowStreamClient({
 *   contracts: { vault: "0x...", flowToken: "0x...", ... },
 *   wallet: "0xprivatekey...",
 * });
 *
 * // Read vault state
 * const vault = await client.getVault("0x...");
 * console.log(`YES pool: ${formatUSDC(vault.yesTotal)} USDC`);
 *
 * // Stream USDC
 * await client.stream({
 *   vaultId: "0x...",
 *   side: "yes",
 *   amount: parseUSDC("10.00"),
 * });
 * ```
 */

// Main client
export { FlowStreamClient } from "./client.js";

// Types
export type {
  FlowStreamClientConfig,
  CreateVaultParams,
  StreamParams,
  ResolveParams,
  TxResult,
  CreateVaultResult,
  FlowBalanceInfo,
  ProtocolState,
  PriceParams,
} from "./types.js";

// Re-exported shared types (convenience for consumers)
export type {
  VaultState,
  VaultSummary,
  VaultStatus,
  VaultOutcome,
  OptionType,
  HotSeverity,
  Position,
  ContractAddresses,
} from "./types.js";

// Errors
export {
  FlowStreamError,
  VaultError,
  WalletRequiredError,
  VaultNotFoundError,
  ContractCallError,
} from "./errors.js";

// Vault domain (for direct access)
export { VaultReader } from "./vault/index.js";
export { VaultWriter } from "./vault/index.js";
export {
  calculateYesPrice,
  calculateNoPrice,
  calculateShares,
  calculateMultiplier,
  getHotMultiplier,
} from "./vault/index.js";

// FLOW token domain
export { FlowBalanceReader } from "./flow-token/index.js";
export { FlowStaking } from "./flow-token/index.js";

// Session keys
export { SessionKeyManager } from "./session/index.js";
export type { SessionKeyConfig, SessionKey } from "./session/index.js";

// Utilities
export {
  formatUSDC,
  parseUSDC,
  formatFLOW,
  parseFLOW,
  explorerTxUrl,
  explorerAddressUrl,
} from "./utils/index.js";

// Circle Gateway Nanopayments integration
export {
  FlowStreamNanopayClient,
  createFlowStreamPaywall,
} from "./nanopay/gateway-client.js";
export type {
  NanopayConfig,
  NanopayBalances,
  NanopayDepositResult,
  NanopayWithdrawResult,
  NanopayPayResult,
  NanopaySupportResult,
  NanopayMiddlewareConfig,
} from "./nanopay/gateway-client.js";

// Nanopay-specific types from config
export type { NanopayClientConfig } from "./types.js";

// ABIs (for advanced consumers who want direct viem contract calls)
export {
  VAULT_ABI,
  FLOW_TOKEN_ABI,
  PROTOCOL_LP_ABI,
  ERC20_ABI,
} from "./abi.js";
