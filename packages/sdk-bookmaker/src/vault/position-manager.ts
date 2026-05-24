/**
 * PositionManager — track and manage the agent's active positions.
 *
 * Wraps on-chain vault reads/writes for staking, adjusting, and
 * exiting positions. Maintains a local cache of active vault IDs
 * so the agent knows which vaults it has capital in.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ContractAddresses, Position } from "@flowstream/types";
import { ARC_TESTNET } from "@flowstream/types";
import { arcTestnet } from "./vault-creator.js";

// ---------------------------------------------------------------------------
// ABI fragments
// ---------------------------------------------------------------------------

const VAULT_STREAM_ABI = [
  {
    type: "function" as const,
    name: "stream" as const,
    inputs: [
      { name: "vaultId", type: "bytes32" as const },
      { name: "yesSide", type: "bool" as const },
      { name: "amount", type: "uint256" as const },
    ],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
] as const;

const VAULT_WITHDRAW_ABI = [
  {
    type: "function" as const,
    name: "withdraw" as const,
    inputs: [{ name: "vaultId", type: "bytes32" as const }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
] as const;

const VAULT_GET_POSITION_ABI = [
  {
    type: "function" as const,
    name: "getPosition" as const,
    inputs: [
      { name: "vaultId", type: "bytes32" as const },
      { name: "user", type: "address" as const },
    ],
    outputs: [
      {
        name: "" as const,
        type: "tuple" as const,
        components: [
          { name: "yesShares", type: "uint256" as const },
          { name: "noShares", type: "uint256" as const },
          { name: "yesDeposited", type: "uint256" as const },
          { name: "noDeposited", type: "uint256" as const },
          { name: "withdrawn", type: "bool" as const },
        ],
      },
    ],
    stateMutability: "view" as const,
  },
] as const;

const ERC20_APPROVE_ABI = [
  {
    type: "function" as const,
    name: "approve" as const,
    inputs: [
      { name: "spender", type: "address" as const },
      { name: "amount", type: "uint256" as const },
    ],
    outputs: [{ name: "", type: "bool" as const }],
    stateMutability: "nonpayable" as const,
  },
] as const;

// ---------------------------------------------------------------------------
// PositionManager
// ---------------------------------------------------------------------------

export interface ActivePosition {
  vaultId: `0x${string}`;
  side: "yes" | "no";
  staked: bigint;
  createdAt: number;
}

export class PositionManager {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly account: Account;
  private readonly contracts: ContractAddresses;

  /** Local tracker of vaults we've staked in */
  private _activePositions: Map<string, ActivePosition> = new Map();

  constructor(
    wallet: `0x${string}` | WalletClient,
    contracts: ContractAddresses,
    rpcUrl?: string,
  ) {
    this.contracts = contracts;

    const rpc = rpcUrl ?? ARC_TESTNET.rpcUrl;
    const transport = http(rpc);

    this.publicClient = createPublicClient({
      chain: arcTestnet,
      transport,
    });

    if (typeof wallet === "string") {
      this.account = privateKeyToAccount(wallet);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: arcTestnet,
        transport,
      });
    } else {
      this.walletClient = wallet;
      if (!wallet.account) {
        throw new Error("WalletClient must have an account attached");
      }
      this.account = wallet.account;
    }
  }

  /** Get the agent's address */
  get address(): `0x${string}` {
    return this.account.address;
  }

  /** All locally tracked active positions */
  get activePositions(): ActivePosition[] {
    return Array.from(this._activePositions.values());
  }

  /** Number of active positions */
  get positionCount(): number {
    return this._activePositions.size;
  }

  /**
   * Record that the agent has staked in a vault.
   * Called after VaultCreator.createVault succeeds.
   */
  trackPosition(vaultId: `0x${string}`, side: "yes" | "no", staked: bigint): void {
    this._activePositions.set(vaultId, {
      vaultId,
      side,
      staked,
      createdAt: Date.now(),
    });
  }

  /**
   * Add more USDC to an existing vault position.
   *
   * Approves USDC then calls stream().
   */
  async addStake(
    vaultId: `0x${string}`,
    side: "yes" | "no",
    amount: bigint,
  ): Promise<`0x${string}`> {
    // Approve
    const approveHash = await this.walletClient.writeContract({
      address: this.contracts.usdc,
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [this.contracts.vault, amount],
      account: this.account,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: approveHash });

    // Stream
    const txHash = await this.walletClient.writeContract({
      address: this.contracts.vault,
      abi: VAULT_STREAM_ABI,
      functionName: "stream",
      args: [vaultId, side === "yes", amount],
      account: this.account,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    // Update local tracking
    const existing = this._activePositions.get(vaultId);
    if (existing) {
      existing.staked += amount;
    } else {
      this.trackPosition(vaultId, side, amount);
    }

    return txHash;
  }

  /**
   * Withdraw from a resolved vault.
   */
  async withdraw(vaultId: `0x${string}`): Promise<`0x${string}`> {
    const txHash = await this.walletClient.writeContract({
      address: this.contracts.vault,
      abi: VAULT_WITHDRAW_ABI,
      functionName: "withdraw",
      args: [vaultId],
      account: this.account,
      chain: arcTestnet,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    // Remove from local tracking
    this._activePositions.delete(vaultId);

    return txHash;
  }

  /**
   * Read the agent's on-chain position in a vault.
   */
  async getPosition(vaultId: `0x${string}`): Promise<Position> {
    const result = await this.publicClient.readContract({
      address: this.contracts.vault,
      abi: VAULT_GET_POSITION_ABI,
      functionName: "getPosition",
      args: [vaultId, this.account.address],
    });

    return {
      yesShares: result[0],
      noShares: result[1],
      yesDeposited: result[2],
      noDeposited: result[3],
      withdrawn: result[4],
    };
  }

  /**
   * Remove a vault from local tracking (e.g., after resolution).
   */
  removePosition(vaultId: `0x${string}`): void {
    this._activePositions.delete(vaultId);
  }
}
