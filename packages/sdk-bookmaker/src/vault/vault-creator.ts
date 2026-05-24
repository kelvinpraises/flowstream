/**
 * VaultCreator — create prediction vaults on Arc via viem.
 *
 * Handles USDC approval and vault creation in a single flow.
 * Translates from the SDK's types to on-chain function calls.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ContractAddresses, OptionType } from "@flowstream/types";
import { ARC_TESTNET } from "@flowstream/types";
import { VaultCreationError } from "../errors.js";

// ---------------------------------------------------------------------------
// ABI fragments — only the functions we call
// ---------------------------------------------------------------------------

const VAULT_CREATE_ABI = [
  {
    type: "function" as const,
    name: "createVault" as const,
    inputs: [
      { name: "option", type: "string" as const },
      { name: "optionType", type: "uint8" as const },
      { name: "duration", type: "uint256" as const },
      { name: "creatorStake", type: "uint256" as const },
      { name: "creatorSide", type: "bool" as const },
    ],
    outputs: [{ name: "vaultId", type: "bytes32" as const }],
    stateMutability: "nonpayable" as const,
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
// OptionType -> uint8 mapping
// ---------------------------------------------------------------------------

const OPTION_TYPE_MAP: Record<OptionType, number> = {
  momentum: 0,
  performance: 1,
  threshold: 2,
  timing: 3,
  swing: 4,
};

// ---------------------------------------------------------------------------
// Arc chain definition for viem
// ---------------------------------------------------------------------------

export const arcTestnet: Chain = {
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [ARC_TESTNET.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_TESTNET.explorer },
  },
};

// ---------------------------------------------------------------------------
// VaultCreator
// ---------------------------------------------------------------------------

export interface CreateVaultParams {
  /** Prediction option text */
  option: string;
  /** Situational option type */
  optionType: OptionType;
  /** Duration in seconds */
  duration: number;
  /** Stake amount in raw USDC units (6 decimals) */
  stake: bigint;
  /** Which side the creator stakes on */
  side: "yes" | "no";
}

export interface CreateVaultResult {
  /** On-chain vault ID */
  vaultId: `0x${string}`;
  /** Transaction hash of the createVault call */
  txHash: `0x${string}`;
}

export class VaultCreator {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly account: Account;
  private readonly contracts: ContractAddresses;

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
      // Private key provided — create wallet client from it
      this.account = privateKeyToAccount(wallet);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: arcTestnet,
        transport,
      });
    } else {
      // Pre-configured WalletClient
      this.walletClient = wallet;
      if (!wallet.account) {
        throw new VaultCreationError(
          "WalletClient must have an account attached",
        );
      }
      this.account = wallet.account;
    }
  }

  /** Get the agent's address */
  get address(): `0x${string}` {
    return this.account.address;
  }

  /**
   * Create a vault on-chain.
   *
   * Flow:
   *   1. Approve USDC spend for the vault contract
   *   2. Call createVault with option params
   *   3. Return vault ID and tx hash
   */
  async createVault(params: CreateVaultParams): Promise<CreateVaultResult> {
    const { option, optionType, duration, stake, side } = params;

    try {
      // Step 1: Approve USDC
      const approveHash = await this.walletClient.writeContract({
        address: this.contracts.usdc,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [this.contracts.vault, stake],
        account: this.account,
        chain: arcTestnet,
      });

      await this.publicClient.waitForTransactionReceipt({
        hash: approveHash,
      });

      // Step 2: Create vault
      const typeInt = OPTION_TYPE_MAP[optionType] ?? 0;
      const creatorSide = side === "yes";

      const txHash = await this.walletClient.writeContract({
        address: this.contracts.vault,
        abi: VAULT_CREATE_ABI,
        functionName: "createVault",
        args: [option, typeInt, BigInt(duration), stake, creatorSide],
        account: this.account,
        chain: arcTestnet,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // The vault ID is emitted in logs or returned — for now we derive
      // it from the transaction hash as a placeholder.
      // In production, parse the VaultCreated event from the receipt logs.
      const vaultId = (receipt.logs[0]?.topics[1] ??
        txHash) as `0x${string}`;

      return { vaultId, txHash };
    } catch (err) {
      throw new VaultCreationError(
        err instanceof Error ? err.message : "Unknown error",
        { cause: err instanceof Error ? err : undefined },
      );
    }
  }
}
