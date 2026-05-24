/**
 * FLOW token staking operations.
 *
 * Stake FLOW to earn USDC dividends from protocol haircuts.
 * Ported from chain.py flow_stake / flow_unstake / flow_claim.
 */

import type { PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { FLOW_TOKEN_ABI } from "../abi.js";
import { ContractCallError } from "../errors.js";
import type { TxResult } from "../types.js";

/**
 * Write operations for FLOW token staking.
 */
export class FlowStaking {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly walletClient: WalletClient<Transport, Chain, Account>,
    private readonly flowTokenAddress: `0x${string}`,
  ) {}

  /**
   * Stake FLOW tokens to earn USDC dividends.
   *
   * @param amount - Amount of FLOW to stake (18 decimals)
   * @returns Transaction hash
   */
  async stake(amount: bigint): Promise<TxResult> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.flowTokenAddress,
        abi: FLOW_TOKEN_ABI,
        functionName: "stake",
        args: [amount],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("stake", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Unstake FLOW tokens back to wallet.
   *
   * @param amount - Amount of FLOW to unstake (18 decimals)
   * @returns Transaction hash
   */
  async unstake(amount: bigint): Promise<TxResult> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.flowTokenAddress,
        abi: FLOW_TOKEN_ABI,
        functionName: "unstake",
        args: [amount],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("unstake", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Claim pending USDC dividends from staked FLOW.
   *
   * @returns Transaction hash
   */
  async claimDividends(): Promise<TxResult> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.flowTokenAddress,
        abi: FLOW_TOKEN_ABI,
        functionName: "claimDividends",
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("claimDividends", err instanceof Error ? err : undefined);
    }
  }
}
