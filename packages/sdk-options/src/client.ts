/**
 * FlowStreamClient — the main entry point for @flowstream/sdk-options.
 *
 * Provides a unified API for reading vault state, streaming USDC,
 * managing FLOW tokens, and querying protocol state.
 *
 * Read operations work without a wallet.
 * Write operations require a wallet (private key or WalletClient).
 *
 * @example
 * ```ts
 * import { FlowStreamClient } from "@flowstream/sdk-options";
 *
 * // Read-only
 * const reader = new FlowStreamClient({
 *   contracts: { vault: "0x...", flowToken: "0x...", ... },
 * });
 * const vault = await reader.getVault("0x...");
 *
 * // With wallet (read + write)
 * const client = new FlowStreamClient({
 *   contracts: { vault: "0x...", flowToken: "0x...", ... },
 *   wallet: "0xprivatekey...",
 * });
 * await client.stream({ vaultId: "0x...", side: "yes", amount: 10_000_000n });
 * ```
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Transport,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET } from "@flowstream/types";
import type {
  VaultState,
  VaultSummary,
  VaultStatus,
  Position,
} from "@flowstream/types";
import { VaultReader } from "./vault/reader.js";
import { VaultWriter } from "./vault/writer.js";
import { FlowBalanceReader } from "./flow-token/balance.js";
import { FlowStaking } from "./flow-token/staking.js";
import { PROTOCOL_LP_ABI, FLOW_TOKEN_ABI } from "./abi.js";
import { WalletRequiredError, ContractCallError } from "./errors.js";
import { FlowStreamNanopayClient } from "./nanopay/gateway-client.js";
import type {
  FlowStreamClientConfig,
  CreateVaultParams,
  StreamParams,
  ResolveParams,
  TxResult,
  CreateVaultResult,
  FlowBalanceInfo,
  ProtocolState,
} from "./types.js";

/**
 * Define the Arc testnet chain for viem.
 */
const arcTestnet: Chain = {
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [ARC_TESTNET.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_TESTNET.explorer },
  },
};

export class FlowStreamClient {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient<Transport, Chain, Account> | null;

  private readonly vaultReader: VaultReader;
  private readonly vaultWriter: VaultWriter | null;
  private readonly flowBalance: FlowBalanceReader;
  private readonly flowStaking: FlowStaking | null;

  /** Circle Gateway nanopayment client (optional, for paying observation feed access) */
  private readonly nanopayClient: FlowStreamNanopayClient | null;

  private readonly contracts: FlowStreamClientConfig["contracts"];

  constructor(config: FlowStreamClientConfig) {
    this.contracts = config.contracts;

    const rpcUrl = config.rpcUrl ?? ARC_TESTNET.rpcUrl;

    // Public client (always created — needed for reads)
    this.publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(rpcUrl),
    });

    // Wallet client (optional — needed for writes)
    if (config.wallet) {
      if (typeof config.wallet === "string") {
        // Private key string — create wallet client from it
        const account = privateKeyToAccount(config.wallet);
        this.walletClient = createWalletClient({
          account,
          chain: arcTestnet,
          transport: http(rpcUrl),
        });
      } else {
        // Already a WalletClient instance
        this.walletClient = config.wallet;
      }
    } else {
      this.walletClient = null;
    }

    // Initialize domain modules
    this.vaultReader = new VaultReader(this.publicClient, config.contracts.vault);
    this.flowBalance = new FlowBalanceReader(this.publicClient, config.contracts.flowToken);

    if (this.walletClient) {
      this.vaultWriter = new VaultWriter(
        this.publicClient,
        this.walletClient,
        config.contracts.vault,
        config.contracts.usdc,
      );
      this.flowStaking = new FlowStaking(
        this.publicClient,
        this.walletClient,
        config.contracts.flowToken,
      );
    } else {
      this.vaultWriter = null;
      this.flowStaking = null;
    }

    // Initialize Circle Gateway nanopayment client (optional)
    if (config.nanopay) {
      this.nanopayClient = new FlowStreamNanopayClient({
        privateKey: config.nanopay.privateKey,
        chain: config.nanopay.chain,
      });
      // nanopay configured for observation feed access
    } else {
      this.nanopayClient = null;
      // no nanopay configured
    }
  }

  // ---------- Vault reads ----------

  /** Get a single vault by ID. */
  async getVault(vaultId: `0x${string}`): Promise<VaultState> {
    return this.vaultReader.getVault(vaultId);
  }

  /** List vaults with optional filters. */
  async listVaults(opts?: {
    status?: VaultStatus;
    limit?: number;
  }): Promise<VaultSummary[]> {
    return this.vaultReader.listVaults(opts);
  }

  /** Get current share price for a side. */
  async getSharePrice(
    vaultId: `0x${string}`,
    yesSide: boolean,
  ): Promise<bigint> {
    return this.vaultReader.getSharePrice(vaultId, yesSide);
  }

  /** Get user's position in a vault. */
  async getPosition(
    vaultId: `0x${string}`,
    user: `0x${string}`,
  ): Promise<Position> {
    return this.vaultReader.getPosition(vaultId, user);
  }

  // ---------- Vault writes (require wallet) ----------

  /** Create a new vault. */
  async createVault(params: CreateVaultParams): Promise<CreateVaultResult> {
    this.requireWallet();
    return this.vaultWriter!.createVault(params);
  }

  /** Stream USDC into a vault side. */
  async stream(params: StreamParams): Promise<TxResult> {
    this.requireWallet();
    return this.vaultWriter!.stream(params);
  }

  /** Submit vault resolution. */
  async resolve(params: ResolveParams): Promise<TxResult> {
    this.requireWallet();
    return this.vaultWriter!.resolve(params);
  }

  /** Finalize after challenge window. */
  async finalize(vaultId: `0x${string}`): Promise<TxResult> {
    this.requireWallet();
    return this.vaultWriter!.finalize(vaultId);
  }

  /** Withdraw winnings / claim FLOW. */
  async withdraw(vaultId: `0x${string}`): Promise<TxResult> {
    this.requireWallet();
    return this.vaultWriter!.withdraw(vaultId);
  }

  // ---------- FLOW token ----------

  /** Get FLOW balance, staked amount, pending dividends. */
  async getFlowBalance(address: `0x${string}`): Promise<FlowBalanceInfo> {
    return this.flowBalance.getFlowBalance(address);
  }

  /** Stake FLOW tokens. */
  async stakeFlow(amount: bigint): Promise<TxResult> {
    this.requireWallet();
    return this.flowStaking!.stake(amount);
  }

  /** Unstake FLOW tokens. */
  async unstakeFlow(amount: bigint): Promise<TxResult> {
    this.requireWallet();
    return this.flowStaking!.unstake(amount);
  }

  /** Claim USDC dividends. */
  async claimDividends(): Promise<TxResult> {
    this.requireWallet();
    return this.flowStaking!.claimDividends();
  }

  // ---------- Protocol state ----------

  /** Get protocol LP total, surplus, and FLOW supply/staked. */
  async getProtocolState(): Promise<ProtocolState> {
    try {
      const [lpTotal, surplus, flowSupply, flowStaked] = await Promise.all([
        this.publicClient.readContract({
          address: this.contracts.protocolLP,
          abi: PROTOCOL_LP_ABI,
          functionName: "totalDeposited",
        }),
        this.publicClient.readContract({
          address: this.contracts.protocolLP,
          abi: PROTOCOL_LP_ABI,
          functionName: "surplus",
        }),
        this.publicClient.readContract({
          address: this.contracts.flowToken,
          abi: FLOW_TOKEN_ABI,
          functionName: "totalSupply",
        }),
        this.publicClient.readContract({
          address: this.contracts.flowToken,
          abi: FLOW_TOKEN_ABI,
          functionName: "totalStaked",
        }),
      ]);

      return { lpTotal, surplus, flowSupply, flowStaked };
    } catch (err) {
      throw new ContractCallError(
        "getProtocolState",
        err instanceof Error ? err : undefined,
      );
    }
  }

  // ---------- Circle Gateway Nanopayments (observation feed access) ----------

  /**
   * Deposit USDC into Circle Gateway for paying observation feed access.
   *
   * One-time onchain tx. After depositing, all subsequent feed payments
   * are gas-free offchain authorizations.
   *
   * @param amount - USDC amount to deposit (e.g. "5" for 5 USDC)
   * @throws If nanopay is not configured
   */
  async depositToGateway(amount: string): Promise<{ depositTxHash: string }> {
    this.requireNanopay();
    return this.nanopayClient!.deposit(amount);
  }

  /**
   * Withdraw USDC from Circle Gateway back to wallet.
   *
   * @param amount - USDC amount to withdraw
   * @param opts - Optional: withdraw to a different chain
   */
  async withdrawFromGateway(
    amount: string,
    opts?: { chain?: string },
  ): Promise<{ formattedAmount: string; mintTxHash: string }> {
    this.requireNanopay();
    return this.nanopayClient!.withdraw(amount, opts);
  }

  /**
   * Get Gateway nanopayment balances (wallet + Gateway).
   */
  async getNanopayBalances(): Promise<{
    wallet: { balance: bigint; formatted: string };
    gateway: { available: bigint; formattedAvailable: string };
  }> {
    this.requireNanopay();
    return this.nanopayClient!.getBalances();
  }

  /**
   * Pay for an x402-protected resource using nanopayments.
   *
   * Use this to access stats provider observation feeds, historical
   * data APIs, or any x402-compatible endpoint in the FlowStream ecosystem.
   *
   * @param url - The x402-protected URL (e.g. stats provider feed endpoint)
   */
  async nanopay(url: string): Promise<{ data: any; status: number }> {
    this.requireNanopay();
    return this.nanopayClient!.pay(url);
  }

  /** Whether nanopayments are configured and available */
  get nanopayEnabled(): boolean {
    return this.nanopayClient !== null;
  }

  // ---------- Accessors ----------

  /** Get the underlying viem PublicClient (for advanced use). */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /** Get the wallet address, or null if read-only. */
  getWalletAddress(): `0x${string}` | null {
    return this.walletClient?.account.address ?? null;
  }

  /** Get the nanopay client for advanced operations. */
  getNanopayClient(): FlowStreamNanopayClient | null {
    return this.nanopayClient;
  }

  // ---------- Internal ----------

  private requireWallet(): void {
    if (!this.walletClient) {
      throw new WalletRequiredError();
    }
  }

  private requireNanopay(): void {
    if (!this.nanopayClient) {
      throw new Error(
        "Nanopayments not configured. Pass `nanopay` in FlowStreamClientConfig " +
        "with a privateKey to enable gas-free streaming.",
      );
    }
  }
}
