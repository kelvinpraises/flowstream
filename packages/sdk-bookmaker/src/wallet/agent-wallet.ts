/**
 * CircleAgentWallet -- wrapper around Circle CLI Agent Wallets.
 *
 * Circle Agent Wallets are operated via the `@circle-fin/cli` command-line
 * tool. There is no importable npm SDK for agent wallets -- all operations
 * go through the CLI binary. This module shells out to `circle` commands
 * and parses their JSON output.
 *
 * Key concepts from Circle docs:
 *   - Agent wallets use 2-of-2 MPC key management (user-custodied)
 *   - Transactions are gas-sponsored (zero gas cost)
 *   - Sessions last 7 days after email OTP authentication
 *   - Wallets are auto-provisioned on all supported chains on login
 *   - Spending policies (limits, allowlists) can be set
 *
 * For FlowStream, we use the agent wallet to:
 *   1. Execute contract calls on Arc Testnet (createVault, approve, etc.)
 *   2. Transfer USDC to fund vaults
 *   3. Deposit into Gateway for nanopayments
 *
 * IMPORTANT: The Circle CLI must be installed globally:
 *   npm install -g @circle-fin/cli
 *
 * And the user must have authenticated:
 *   circle wallet login you@example.com --testnet
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CircleAgentWalletConfig {
  /** Email used for Circle CLI authentication */
  email: string;
  /** Chain identifier (default: "ARC-TESTNET") */
  chain?: string;
  /** Use testnet (default: true) */
  testnet?: boolean;
  /** Wallet address (auto-detected if not provided) */
  walletAddress?: `0x${string}`;
}

export interface CircleExecuteResult {
  id: string;
  state: string;
  blockchain: string;
  txHash: string;
  operation: string;
  contractAddress?: string;
  abiFunctionSignature?: string;
}

export interface CircleTransferResult {
  id: string;
  state: string;
  blockchain: string;
  txHash: string;
  sourceAddress: string;
  destinationAddress: string;
  amounts: string[];
  operation: string;
}

export interface CircleWalletInfo {
  address: string;
  blockchain: string;
  type: string;
}

export interface CircleBalanceInfo {
  token: string;
  amount: string;
  blockchain: string;
}

// ---------------------------------------------------------------------------
// CircleAgentWallet
// ---------------------------------------------------------------------------

export class CircleAgentWallet {
  private readonly email: string;
  private readonly chain: string;
  private readonly testnet: boolean;
  private _walletAddress: `0x${string}` | null;

  constructor(config: CircleAgentWalletConfig) {
    this.email = config.email;
    this.chain = config.chain ?? "ARC-TESTNET";
    this.testnet = config.testnet ?? true;
    this._walletAddress = config.walletAddress ?? null;
  }

  /** The wallet address. Must call init() first if not provided in config. */
  get address(): `0x${string}` {
    if (!this._walletAddress) {
      throw new Error(
        "Wallet address not set. Call init() or provide walletAddress in config.",
      );
    }
    return this._walletAddress;
  }

  /**
   * Initialize the wallet: check auth status and discover wallet address.
   *
   * If the CLI session is not active, this will throw -- the user must
   * have already run `circle wallet login` manually or via the non-interactive
   * flow before using this wrapper.
   */
  async init(): Promise<void> {
    // Check if we have an active session
    const status = await this.runCircleCommand(["wallet", "status", "--type", "agent"]);
    if (!status.includes("Logged in")) {
      throw new Error(
        `Circle CLI session not active. Run: circle wallet login ${this.email}${this.testnet ? " --testnet" : ""}`,
      );
    }

    // If no address provided, discover it
    if (!this._walletAddress) {
      const wallets = await this.listWallets();
      if (wallets.length === 0) {
        throw new Error(
          `No agent wallets found on ${this.chain}. Authenticate first.`,
        );
      }
      this._walletAddress = wallets[0].address as `0x${string}`;
    }
  }

  /**
   * List agent wallets on the configured chain.
   */
  async listWallets(): Promise<CircleWalletInfo[]> {
    const output = await this.runCircleCommandJson([
      "wallet", "list",
      "--type", "agent",
      "--chain", this.chain,
    ]);
    return output?.data?.wallets ?? [];
  }

  /**
   * Get the USDC balance of the agent wallet.
   */
  async getBalance(): Promise<CircleBalanceInfo[]> {
    const output = await this.runCircleCommandJson([
      "wallet", "balance",
      "--address", this.address,
      "--chain", this.chain,
    ]);
    return output?.data?.balances ?? [];
  }

  /**
   * Execute a smart contract function from the agent wallet.
   *
   * This is the primary method for FlowStream -- used to call
   * createVault, approve, stream, etc. on Arc contracts.
   *
   * Gas is sponsored by Circle (zero cost to the agent).
   *
   * @param abiFunctionSignature - e.g. "approve(address,uint256)"
   * @param abiParameters - e.g. ["0xSpender", "1000000"]
   * @param contractAddress - Target contract address
   * @returns Execution result with txHash
   */
  async executeContract(
    abiFunctionSignature: string,
    abiParameters: string[],
    contractAddress: `0x${string}`,
  ): Promise<CircleExecuteResult> {
    const args = [
      "wallet", "execute",
      abiFunctionSignature,
      ...abiParameters,
      "--contract", contractAddress,
      "--address", this.address,
      "--chain", this.chain,
    ];

    const output = await this.runCircleCommandJson(args);

    if (output?.data?.state === "CONFIRMED" || output?.data?.state === "COMPLETE") {
      return output.data as CircleExecuteResult;
    }

    throw new Error(
      `Contract execution failed: ${JSON.stringify(output?.data ?? output)}`,
    );
  }

  /**
   * Transfer USDC from the agent wallet to another address.
   *
   * @param toAddress - Recipient address
   * @param amount - Amount in USDC (e.g. "1.0" for 1 USDC)
   * @returns Transfer result with txHash
   */
  async transfer(
    toAddress: `0x${string}`,
    amount: string,
  ): Promise<CircleTransferResult> {
    const args = [
      "wallet", "transfer",
      toAddress,
      "--amount", amount,
      "--address", this.address,
      "--chain", this.chain,
    ];

    const output = await this.runCircleCommandJson(args);

    if (output?.data?.state === "CONFIRMED" || output?.data?.state === "COMPLETE") {
      return output.data as CircleTransferResult;
    }

    throw new Error(
      `Transfer failed: ${JSON.stringify(output?.data ?? output)}`,
    );
  }

  /**
   * Deposit USDC into Gateway for nanopayments.
   *
   * After depositing, the agent can make gas-free sub-cent payments
   * to x402-compatible services.
   *
   * @param amount - USDC amount to deposit (e.g. "5")
   * @param method - Deposit method: "eco" or "direct" (default: "direct")
   */
  async depositToGateway(
    amount: string,
    method: "eco" | "direct" = "direct",
  ): Promise<void> {
    const args = [
      "gateway", "deposit",
      "--amount", amount,
      "--address", this.address,
      "--chain", this.chain,
      "--method", method,
    ];

    await this.runCircleCommandJson(args);
  }

  /**
   * Check the Gateway balance for nanopayments.
   */
  async getGatewayBalance(): Promise<CircleBalanceInfo[]> {
    const output = await this.runCircleCommandJson([
      "gateway", "balance",
      "--address", this.address,
      "--chain", this.chain,
    ]);
    return output?.data?.balances ?? [];
  }

  /**
   * Set spending policies for the agent wallet.
   * Only available on mainnet. On testnet, policies are not enforced.
   */
  async setSpendingLimits(params: {
    perTx?: string;
    daily?: string;
    weekly?: string;
    monthly?: string;
  }): Promise<void> {
    const args = [
      "wallet", "limit", "set",
      "--address", this.address,
      "--chain", this.chain,
      "--policy-type", "stablecoin",
    ];

    if (params.perTx) args.push("--per-tx", params.perTx);
    if (params.daily) args.push("--daily", params.daily);
    if (params.weekly) args.push("--weekly", params.weekly);
    if (params.monthly) args.push("--monthly", params.monthly);

    await this.runCircleCommand(args);
  }

  /**
   * Sign a message with the agent wallet.
   *
   * @param message - Message to sign
   * @returns Signature hex string
   */
  async signMessage(message: string): Promise<string> {
    const output = await this.runCircleCommandJson([
      "wallet", "sign", "message",
      message,
      "--address", this.address,
      "--chain", this.chain,
    ]);
    return output?.data?.signature ?? "";
  }

  // ---------------------------------------------------------------------------
  // Convenience methods for FlowStream-specific contract calls
  // ---------------------------------------------------------------------------

  /**
   * Approve USDC spending for a contract (gas-free via Circle Agent Wallet).
   *
   * @param spender - Contract address to approve
   * @param amount - Amount in raw USDC units (e.g. "10000000" for 10 USDC)
   */
  async approveUSDC(
    spender: `0x${string}`,
    amount: bigint,
    usdcAddress: `0x${string}`,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "approve(address,uint256)",
      [spender, amount.toString()],
      usdcAddress,
    );
  }

  /**
   * Create a vault via Circle Agent Wallet (gas-free).
   *
   * @param vaultContract - Vault contract address
   * @param option - Prediction text
   * @param optionType - Option type as uint8
   * @param duration - Duration in seconds
   * @param stake - Stake in raw USDC units
   * @param creatorSide - true = YES, false = NO
   */
  async createVault(
    vaultContract: `0x${string}`,
    option: string,
    optionType: number,
    duration: bigint,
    stake: bigint,
    creatorSide: boolean,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "createVault(string,uint8,uint256,uint256,bool)",
      [option, optionType.toString(), duration.toString(), stake.toString(), creatorSide.toString()],
      vaultContract,
    );
  }

  /**
   * Stream USDC into a vault side via Circle Agent Wallet (gas-free).
   */
  async streamToVault(
    vaultContract: `0x${string}`,
    vaultId: `0x${string}`,
    yesSide: boolean,
    amount: bigint,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "stream(bytes32,bool,uint256)",
      [vaultId, yesSide.toString(), amount.toString()],
      vaultContract,
    );
  }

  /**
   * Register agent identity via ERC-8004 (gas-free).
   */
  async registerAgent(
    agentRegistryAddress: `0x${string}`,
    name: string,
    agentType: number,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "registerAgent(string,uint8)",
      [name, agentType.toString()],
      agentRegistryAddress,
    );
  }

  // ---------------------------------------------------------------------------
  // Internal: CLI execution
  // ---------------------------------------------------------------------------

  /**
   * Run a circle CLI command and return raw stdout.
   */
  private async runCircleCommand(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync("circle", args, {
        timeout: 120_000, // 2 minutes max for onchain tx
      });
      return stdout.trim();
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      throw new Error(
        `Circle CLI error: ${error.stderr ?? error.message ?? "Unknown error"}`,
      );
    }
  }

  /**
   * Run a circle CLI command with --output json and parse the result.
   */
  private async runCircleCommandJson(args: string[]): Promise<any> {
    const stdout = await this.runCircleCommand([...args, "--output", "json"]);
    try {
      return JSON.parse(stdout);
    } catch {
      throw new Error(`Failed to parse Circle CLI JSON output: ${stdout}`);
    }
  }
}
