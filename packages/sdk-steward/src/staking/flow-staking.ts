/**
 * FlowStaking — $FLOW staking for proposals and dividends.
 *
 * Uses FlowToken.sol:
 * - stake(amount) — lock FLOW, earn dividends
 * - unstake(amount) — unlock FLOW
 * - claimDividends() — claim accumulated USDC dividends
 * - balanceOf(address) — FLOW balance
 * - staked(address) — staked amount
 * - pendingRewards(address) — pending USDC dividends
 *
 * Stewards need staked FLOW to submit proposals. The staking module
 * manages the FLOW lifecycle for governance participation.
 */

import type { PublicClient, WalletClient, Account } from "viem";
import type { ContractAddresses } from "@flowstream/types";
import { StakingError } from "../errors.js";

/** ABI for FlowToken staking operations */
const FLOW_TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "staked",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalStaked",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "pendingRewards",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "emissionRate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "stake",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "unstake",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "claimDividends",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export interface FlowBalance {
  /** Unstaked FLOW balance (in wallet) */
  balance: bigint;
  /** Staked FLOW amount */
  staked: bigint;
  /** Pending USDC dividends */
  pendingDividends: bigint;
  /** Total FLOW supply staked across all users */
  totalStaked: bigint;
  /** Current emission rate (FLOW per USDC lost) */
  emissionRate: bigint;
}

export class FlowStaking {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: Account;
  private contracts: ContractAddresses;

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient,
    account: Account,
    contracts: ContractAddresses,
  ) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.account = account;
    this.contracts = contracts;
  }

  /**
   * Get the full FLOW balance for the steward's account.
   */
  async getBalance(): Promise<FlowBalance> {
    try {
      const [balance, staked, pendingDividends, totalStaked, emissionRate] =
        await Promise.all([
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "balanceOf",
            args: [this.account.address],
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "staked",
            args: [this.account.address],
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "pendingRewards",
            args: [this.account.address],
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "totalStaked",
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "emissionRate",
          }) as Promise<bigint>,
        ]);

      return {
        balance,
        staked,
        pendingDividends,
        totalStaked,
        emissionRate,
      };
    } catch (error) {
      throw new StakingError("Failed to fetch FLOW balance", {
        cause: error instanceof Error ? error : undefined,
        details: "Could not read FlowToken state from chain",
      });
    }
  }

  /**
   * Get the FLOW balance for any address.
   */
  async getBalanceOf(address: `0x${string}`): Promise<FlowBalance> {
    try {
      const [balance, staked, pendingDividends, totalStaked, emissionRate] =
        await Promise.all([
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "staked",
            args: [address],
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "pendingRewards",
            args: [address],
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "totalStaked",
          }) as Promise<bigint>,
          this.publicClient.readContract({
            address: this.contracts.flowToken,
            abi: FLOW_TOKEN_ABI,
            functionName: "emissionRate",
          }) as Promise<bigint>,
        ]);

      return {
        balance,
        staked,
        pendingDividends,
        totalStaked,
        emissionRate,
      };
    } catch (error) {
      throw new StakingError(`Failed to fetch FLOW balance for ${address}`, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Stake FLOW tokens. Staked FLOW earns dividends from protocol LP.
   *
   * @param amount - Amount of FLOW to stake (18 decimals)
   */
  async stake(amount: bigint): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.flowToken,
        abi: FLOW_TOKEN_ABI,
        functionName: "stake",
        args: [amount],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new StakingError("Failed to stake FLOW", {
        cause: error instanceof Error ? error : undefined,
        details: `Attempted to stake ${amount} FLOW. Check balance and approval.`,
      });
    }
  }

  /**
   * Unstake FLOW tokens.
   *
   * @param amount - Amount of FLOW to unstake (18 decimals)
   */
  async unstake(amount: bigint): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.flowToken,
        abi: FLOW_TOKEN_ABI,
        functionName: "unstake",
        args: [amount],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new StakingError("Failed to unstake FLOW", {
        cause: error instanceof Error ? error : undefined,
        details: `Attempted to unstake ${amount} FLOW. Check staked balance.`,
      });
    }
  }

  /**
   * Claim pending USDC dividends from staking.
   */
  async claimDividends(): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.flowToken,
        abi: FLOW_TOKEN_ABI,
        functionName: "claimDividends",
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new StakingError("Failed to claim dividends", {
        cause: error instanceof Error ? error : undefined,
        details: "No pending dividends, or ProtocolLP insufficient.",
      });
    }
  }

  /**
   * Approve the Steward contract to spend FLOW (for proposals).
   * This is a convenience method; the proposal manager also handles approval.
   *
   * @param amount - Amount to approve
   */
  async approveForProposals(amount: bigint): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.flowToken,
        abi: FLOW_TOKEN_ABI,
        functionName: "approve",
        args: [this.contracts.steward, amount],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new StakingError("Failed to approve FLOW for proposals", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}
