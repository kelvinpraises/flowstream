/**
 * FlowStream Gateway Nanopayment Client.
 *
 * Wraps Circle's @circle-fin/x402-batching SDK to enable gas-free,
 * sub-cent USDC payments for accessing observation feeds and API endpoints.
 *
 * How nanopayments work in FlowStream:
 *   1. Stats providers run `flowstream observe` and serve observation feeds
 *   2. Consumers (bookmaker agents, client apps) pay to access feeds
 *   3. Payments are signed offchain via EIP-3009 (zero gas)
 *   4. Gateway batches authorizations and settles on-chain
 *   5. Stats providers earn per-access fees for their observation data
 *
 * This is NOT for vault streaming (that's on-chain via Vault.stream()).
 * Nanopayments are for the observation data marketplace — paying stats
 * providers for live CV feeds, paying for API queries, etc.
 *
 * Requirements:
 *   - npm install @circle-fin/x402-batching
 *   - An EOA wallet private key (SCAs are NOT supported for nanopayments)
 *   - USDC balance on a supported chain
 *
 * Supported chains for nanopayments (testnet):
 *   arcTestnet, baseSepolia, arbitrumSepolia, optimismSepolia,
 *   polygonAmoy, avalancheFuji, sepolia, unichainSepolia,
 *   sonicTestnet, hyperEvmTestnet, seiAtlantic, worldChainSepolia
 */

// ---------------------------------------------------------------------------
// Types -- defined here to avoid hard dependency on @circle-fin/x402-batching
// until it's installed. The actual GatewayClient import is dynamic.
// ---------------------------------------------------------------------------

export interface NanopayConfig {
  /** Private key of the EOA wallet (0x-prefixed hex) */
  privateKey: `0x${string}`;
  /**
   * Chain name for Gateway operations.
   * Must be a supported nanopayment chain.
   * Default: "arcTestnet"
   */
  chain?: string;
  /** Gateway API URL (default: testnet) */
  facilitatorUrl?: string;
}

export interface NanopayBalances {
  wallet: {
    balance: bigint;
    formatted: string;
  };
  gateway: {
    available: bigint;
    formattedAvailable: string;
  };
}

export interface NanopayDepositResult {
  depositTxHash: string;
}

export interface NanopayWithdrawResult {
  formattedAmount: string;
  mintTxHash: string;
}

export interface NanopayPayResult {
  data: any;
  status: number;
}

export interface NanopaySupportResult {
  supported: boolean;
}

// ---------------------------------------------------------------------------
// FlowStreamNanopayClient
// ---------------------------------------------------------------------------

/**
 * Nanopayment client for accessing FlowStream observation feeds.
 *
 * Uses Circle Gateway's batched settlement to enable gas-free
 * micro-payments for consuming stats provider observation data.
 *
 * @example
 * ```ts
 * const nanopay = new FlowStreamNanopayClient({
 *   privateKey: "0x...",
 *   chain: "arcTestnet",
 * });
 *
 * // One-time: deposit USDC into Gateway
 * await nanopay.deposit("5");
 *
 * // Check balance
 * const balances = await nanopay.getBalances();
 *
 * // Pay for access to a stats provider's observation feed
 * const result = await nanopay.pay("https://stats.flowstream.xyz/feed/match-123");
 *
 * // Withdraw remaining balance
 * await nanopay.withdraw("2");
 * ```
 */
export class FlowStreamNanopayClient {
  private readonly config: Required<NanopayConfig>;
  private gatewayClient: any | null = null;

  constructor(config: NanopayConfig) {
    this.config = {
      privateKey: config.privateKey,
      chain: config.chain ?? "arcTestnet",
      facilitatorUrl:
        config.facilitatorUrl ?? "https://gateway-api-testnet.circle.com",
    };
  }

  /**
   * Initialize the underlying GatewayClient from @circle-fin/x402-batching.
   *
   * This is called lazily on first use. If the package is not installed,
   * it throws a clear error telling the user to install it.
   */
  private async ensureClient(): Promise<any> {
    if (this.gatewayClient) return this.gatewayClient;

    try {
      // Dynamic import to avoid hard build-time dependency
      const mod = await import("@circle-fin/x402-batching/client");
      const GatewayClient = mod.GatewayClient;

      this.gatewayClient = new GatewayClient({
        chain: this.config.chain,
        privateKey: this.config.privateKey,
      });

      return this.gatewayClient;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === "ERR_MODULE_NOT_FOUND" || error.code === "MODULE_NOT_FOUND") {
        throw new Error(
          "Gateway nanopayments require @circle-fin/x402-batching. " +
          "Install it with: npm install @circle-fin/x402-batching",
        );
      }
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // Core operations
  // -----------------------------------------------------------------------

  /**
   * Get wallet and Gateway balances.
   *
   * Calls the Gateway API's Get Token Balances endpoint.
   */
  async getBalances(): Promise<NanopayBalances> {
    const client = await this.ensureClient();
    return client.getBalances();
  }

  /**
   * Deposit USDC into Gateway for nanopayments.
   *
   * This is a one-time onchain transaction. After depositing,
   * all subsequent payments are gas-free.
   *
   * @param amount - USDC amount as a string (e.g. "5" for 5 USDC)
   * @returns Deposit transaction hash
   */
  async deposit(amount: string): Promise<NanopayDepositResult> {
    const client = await this.ensureClient();
    return client.deposit(amount);
  }

  /**
   * Withdraw USDC from Gateway back to the wallet.
   *
   * @param amount - USDC amount to withdraw
   * @param opts - Optional: withdraw to a different chain
   * @returns Withdrawal result with mint transaction hash
   */
  async withdraw(
    amount: string,
    opts?: { chain?: string },
  ): Promise<NanopayWithdrawResult> {
    const client = await this.ensureClient();
    return client.withdraw(amount, opts);
  }

  /**
   * Pay for an x402-protected resource using nanopayments.
   *
   * The full flow is handled automatically:
   *   1. Send initial request to the URL
   *   2. Receive 402 Payment Required with payment details
   *   3. Sign an EIP-3009 authorization offchain (zero gas)
   *   4. Retry with PAYMENT-SIGNATURE header
   *
   * @param url - The x402-protected resource URL
   * @param opts - Optional: HTTP method, body, headers
   * @returns Response data and status
   */
  async pay(
    url: string,
    opts?: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    },
  ): Promise<NanopayPayResult> {
    const client = await this.ensureClient();
    return client.pay(url, opts);
  }

  /**
   * Check if a URL supports Gateway nanopayments.
   *
   * Sends a request and inspects the 402 response for compatible
   * Gateway batching payment options.
   *
   * @param url - URL to check
   * @returns Whether the URL supports Gateway payments
   */
  async supports(url: string): Promise<NanopaySupportResult> {
    const client = await this.ensureClient();
    return client.supports(url);
  }
}

// ---------------------------------------------------------------------------
// Server-side middleware for FlowStream APIs
// ---------------------------------------------------------------------------

/**
 * Configuration for the FlowStream nanopayment middleware.
 *
 * Use this to protect observation feed endpoints with x402 payments.
 * Stats providers monetize their feeds by charging per-access fees.
 * For example, charge per observation batch or per WebSocket connection.
 */
export interface NanopayMiddlewareConfig {
  /** Address where you want to receive USDC payments */
  sellerAddress: `0x${string}`;
  /** Gateway API URL (default: testnet) */
  facilitatorUrl?: string;
  /** Restrict accepted networks (default: all supported) */
  networks?: string[];
}

/**
 * Create Express middleware for accepting nanopayments on FlowStream APIs.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { createFlowStreamPaywall } from "@flowstream/sdk-options/nanopay";
 *
 * const app = express();
 * const paywall = await createFlowStreamPaywall({
 *   sellerAddress: "0xYourStatsProviderAddress",
 * });
 *
 * // Charge $0.001 per observation feed access
 * app.get("/api/feed/:matchId", paywall.require("$0.001"), (req, res) => {
 *   res.json({ frames: "..." });
 * });
 * ```
 */
export async function createFlowStreamPaywall(
  config: NanopayMiddlewareConfig,
): Promise<any> {
  try {
    const mod = await import("@circle-fin/x402-batching/server");
    const createGatewayMiddleware = mod.createGatewayMiddleware;

    return createGatewayMiddleware({
      sellerAddress: config.sellerAddress,
      facilitatorUrl:
        config.facilitatorUrl ?? "https://gateway-api-testnet.circle.com",
      networks: config.networks,
    });
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === "ERR_MODULE_NOT_FOUND" || error.code === "MODULE_NOT_FOUND") {
      throw new Error(
        "Gateway nanopayment middleware requires @circle-fin/x402-batching. " +
        "Install it with: npm install @circle-fin/x402-batching",
      );
    }
    throw err;
  }
}
