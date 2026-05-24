/**
 * CircleAgentWallet for the Steward SDK.
 *
 * Wraps Circle CLI Agent Wallet commands for steward-specific operations:
 *   - Registering as a steward on-chain (gas-free)
 *   - Executing governance proposals (gas-free)
 *   - Submitting resolutions and challenges (gas-free)
 *   - Staking FLOW tokens
 *
 * All transactions are gas-sponsored by Circle. The steward agent
 * does not need to hold native tokens for gas.
 *
 * Prerequisites:
 *   npm install -g @circle-fin/cli
 *   circle wallet login steward@example.com --testnet
 *
 * See the bookmaker wallet module for full CLI documentation.
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
   * Initialize: verify CLI session is active and discover wallet address.
   */
  async init(): Promise<void> {
    const status = await this.runCircleCommand(["wallet", "status", "--type", "agent"]);
    if (!status.includes("Logged in")) {
      throw new Error(
        `Circle CLI session not active. Run: circle wallet login ${this.email}${this.testnet ? " --testnet" : ""}`,
      );
    }

    if (!this._walletAddress) {
      const output = await this.runCircleCommandJson([
        "wallet", "list",
        "--type", "agent",
        "--chain", this.chain,
      ]);
      const wallets = output?.data?.wallets ?? [];
      if (wallets.length === 0) {
        throw new Error(`No agent wallets found on ${this.chain}`);
      }
      this._walletAddress = wallets[0].address as `0x${string}`;
    }
  }

  /**
   * Execute a smart contract function (gas-sponsored).
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
   * Transfer USDC from the agent wallet.
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

  // ---------------------------------------------------------------------------
  // Steward-specific convenience methods
  // ---------------------------------------------------------------------------

  /**
   * Register as a steward on-chain (gas-free via Circle Agent Wallet).
   */
  async registerSteward(
    stewardContract: `0x${string}`,
    name: string,
    tier: number,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "registerSteward(string,uint8)",
      [name, tier.toString()],
      stewardContract,
    );
  }

  /**
   * Submit a vault resolution (gas-free).
   */
  async submitResolution(
    vaultContract: `0x${string}`,
    vaultId: `0x${string}`,
    outcome: number,
    proofCid: `0x${string}`,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "resolve(bytes32,uint8,bytes32)",
      [vaultId, outcome.toString(), proofCid],
      vaultContract,
    );
  }

  /**
   * Finalize a resolution after the challenge window (gas-free).
   */
  async confirmResolution(
    vaultContract: `0x${string}`,
    vaultId: `0x${string}`,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "finalize(bytes32)",
      [vaultId],
      vaultContract,
    );
  }

  /**
   * Challenge a resolution with counter-proof (gas-free).
   */
  async challengeResolution(
    vaultContract: `0x${string}`,
    vaultId: `0x${string}`,
    proofCid: `0x${string}`,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "challengeResolution(bytes32,bytes32)",
      [vaultId, proofCid],
      vaultContract,
    );
  }

  /**
   * Approve FLOW token spending for governance staking (gas-free).
   */
  async approveFlowToken(
    flowTokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
  ): Promise<CircleExecuteResult> {
    return this.executeContract(
      "approve(address,uint256)",
      [spender, amount.toString()],
      flowTokenAddress,
    );
  }

  /**
   * Deposit into Gateway for nanopayments (gas-free).
   */
  async depositToGateway(
    amount: string,
    method: "eco" | "direct" = "direct",
  ): Promise<void> {
    await this.runCircleCommandJson([
      "gateway", "deposit",
      "--amount", amount,
      "--address", this.address,
      "--chain", this.chain,
      "--method", method,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async runCircleCommand(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync("circle", args, {
        timeout: 120_000,
      });
      return stdout.trim();
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      throw new Error(
        `Circle CLI error: ${error.stderr ?? error.message ?? "Unknown error"}`,
      );
    }
  }

  private async runCircleCommandJson(args: string[]): Promise<any> {
    const stdout = await this.runCircleCommand([...args, "--output", "json"]);
    try {
      return JSON.parse(stdout);
    } catch {
      throw new Error(`Failed to parse Circle CLI JSON output: ${stdout}`);
    }
  }
}
