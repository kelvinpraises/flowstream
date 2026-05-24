/**
 * Challenges — challenge existing proposals and veto (in-house only).
 *
 * Uses Steward.sol:
 * - challengeProposal(proposalId, flowStake)
 * - veto(proposalId) — InHouse only, max 5/month
 *
 * And Vault.sol:
 * - challenge(vaultId, proofCid) — challenge a pending resolution
 */

import type { PublicClient, WalletClient, Account } from "viem";
import type { ContractAddresses } from "@flowstream/types";
import { ChallengeError, VetoError } from "../errors.js";

/** ABI for Steward challenge/veto operations */
const STEWARD_ABI = [
  {
    name: "challengeProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "flowStake", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "veto",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
] as const;

/** ABI for Vault resolution challenge */
const VAULT_ABI = [
  {
    name: "challenge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "proofCid", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

/** ABI for FlowToken approve */
const FLOW_TOKEN_ABI = [
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

export class ChallengeManager {
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
   * Challenge a governance proposal by staking $FLOW against it.
   *
   * The challenger stakes FLOW. If the challenge succeeds (proposal is vetoed
   * or found invalid), the challenger gets their stake back plus the proposer's
   * stake. If the challenge fails, the challenger loses their stake.
   *
   * @param proposalId - The proposal to challenge
   * @param flowStake - Amount of $FLOW to stake on the challenge
   */
  async challengeProposal(
    proposalId: number,
    flowStake: bigint,
  ): Promise<`0x${string}`> {
    try {
      // Approve FLOW spending
      await this.walletClient.writeContract({
        address: this.contracts.flowToken,
        abi: FLOW_TOKEN_ABI,
        functionName: "approve",
        args: [this.contracts.steward, flowStake],
        account: this.account,
        chain: this.walletClient.chain,
      });

      // Submit challenge
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "challengeProposal",
        args: [BigInt(proposalId), flowStake],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new ChallengeError(
        `Failed to challenge proposal ${proposalId}`,
        {
          cause: error instanceof Error ? error : undefined,
          details:
            "The proposal may not be in pending status, or the challenge window may have closed",
        },
      );
    }
  }

  /**
   * Veto a proposal. In-house steward only. Max 5 per month.
   *
   * Vetoing burns the proposer's stake and returns the challenger's
   * stake (if the proposal was challenged).
   *
   * @param proposalId - The proposal to veto
   */
  async vetoProposal(proposalId: number): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "veto",
        args: [BigInt(proposalId)],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new VetoError(`Failed to veto proposal ${proposalId}`, {
        cause: error instanceof Error ? error : undefined,
        details:
          "You may not be an in-house steward, may have exceeded the monthly veto limit (5), or the proposal is not in a vetoable state",
      });
    }
  }

  /**
   * Challenge a vault resolution by submitting a counter-proof.
   *
   * This is a vault-level operation (not a steward proposal).
   * The challenger submits an alternative IPFS proof CID that contradicts
   * the original resolution.
   *
   * @param vaultId - The vault whose resolution to challenge
   * @param proofCid - IPFS CID of counter-proof (bytes32)
   */
  async challengeResolution(
    vaultId: `0x${string}`,
    proofCid: `0x${string}`,
  ): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.vault,
        abi: VAULT_ABI,
        functionName: "challenge",
        args: [vaultId, proofCid],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new ChallengeError(
        `Failed to challenge resolution for vault ${vaultId}`,
        {
          cause: error instanceof Error ? error : undefined,
          details:
            "The vault may not be in locked status, or the challenge window may have closed",
        },
      );
    }
  }
}
