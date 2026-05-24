/**
 * FLOW token balance reader.
 *
 * Reads FLOW balance, staked amount, and pending dividends from chain.
 * Ported from chain.py flow_balance / flow_staked / flow_pending_rewards.
 */

import type { PublicClient } from "viem";
import { FLOW_TOKEN_ABI } from "../abi.js";
import { ContractCallError } from "../errors.js";
import type { FlowBalanceInfo } from "../types.js";

/**
 * Read FLOW token balances from the FlowToken contract.
 */
export class FlowBalanceReader {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly flowTokenAddress: `0x${string}`,
  ) {}

  /**
   * Get comprehensive FLOW balance info for an address.
   *
   * Makes three parallel read calls for efficiency:
   * - balanceOf: unstaked FLOW in wallet
   * - staked: FLOW locked in staking contract
   * - pendingRewards: unclaimed USDC dividends
   *
   * @param address - User address to check
   * @returns Balance, staked amount, and pending dividends
   */
  async getFlowBalance(address: `0x${string}`): Promise<FlowBalanceInfo> {
    try {
      const [balance, staked, pendingDividends] = await Promise.all([
        this.publicClient.readContract({
          address: this.flowTokenAddress,
          abi: FLOW_TOKEN_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        this.publicClient.readContract({
          address: this.flowTokenAddress,
          abi: FLOW_TOKEN_ABI,
          functionName: "staked",
          args: [address],
        }),
        this.publicClient.readContract({
          address: this.flowTokenAddress,
          abi: FLOW_TOKEN_ABI,
          functionName: "pendingRewards",
          args: [address],
        }),
      ]);

      return { balance, staked, pendingDividends };
    } catch (err) {
      throw new ContractCallError("getFlowBalance", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Get the total FLOW supply.
   */
  async totalSupply(): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: this.flowTokenAddress,
        abi: FLOW_TOKEN_ABI,
        functionName: "totalSupply",
      });
    } catch (err) {
      throw new ContractCallError("totalSupply", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Get total FLOW staked across all users.
   */
  async totalStaked(): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: this.flowTokenAddress,
        abi: FLOW_TOKEN_ABI,
        functionName: "totalStaked",
      });
    } catch (err) {
      throw new ContractCallError("totalStaked", err instanceof Error ? err : undefined);
    }
  }
}
