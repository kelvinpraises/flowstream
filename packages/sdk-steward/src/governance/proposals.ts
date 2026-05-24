/**
 * Proposals — submit boost/slash/group proposals on-chain.
 *
 * Uses Steward.sol contract:
 * - propose(vaultId, actionType, data, flowStake)
 * - executeProposal(proposalId) — after challenge window
 *
 * Community stewards stake $FLOW on proposals. If challenged and found wrong,
 * the stake is burned. If unchallenged, the proposal executes and stake is returned.
 */

import type { PublicClient, WalletClient, Account } from "viem";
import { encodePacked, encodeAbiParameters } from "viem";
import type { ContractAddresses, Proposal } from "@flowstream/types";
import type { ProposalResult } from "../types.js";
import { mapActionType, mapProposalStatus } from "../utils/index.js";
import { ProposalError } from "../errors.js";

/** ABI for Steward contract proposal operations */
const STEWARD_ABI = [
  {
    name: "propose",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "actionType", type: "uint8" },
      { name: "data", type: "bytes" },
      { name: "flowStake", type: "uint256" },
    ],
    outputs: [{ name: "proposalId", type: "uint256" }],
  },
  {
    name: "executeProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getProposal",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "proposer", type: "address" },
          { name: "vaultId", type: "bytes32" },
          { name: "actionType", type: "uint8" },
          { name: "data", type: "bytes" },
          { name: "flowStaked", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "challengeUntil", type: "uint256" },
          { name: "challenger", type: "address" },
          { name: "challengeStake", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "totalProposals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** ABI for FlowToken approve (needed before proposing) */
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

/** Map action type string to Solidity enum value */
function actionTypeToUint8(action: "boost" | "slash" | "group"): number {
  const map = { boost: 0, slash: 1, group: 2 } as const;
  return map[action];
}

export class ProposalManager {
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
   * Propose a vault boost — deploy protocol surplus into a vault.
   *
   * @param vaultId - The vault to boost
   * @param amount - Amount of USDC to boost (encoded in proposal data)
   * @param flowStake - Amount of $FLOW to stake on this proposal
   */
  async proposeBoost(
    vaultId: `0x${string}`,
    amount: bigint,
    flowStake: bigint,
  ): Promise<ProposalResult> {
    const data = encodeAbiParameters(
      [{ type: "uint256" }],
      [amount],
    );
    return this.submitProposal(vaultId, "boost", data, flowStake);
  }

  /**
   * Propose a slash against a bad actor.
   *
   * @param target - Address of the agent/vault to slash (encoded as vaultId for contract)
   * @param evidence - Evidence data (IPFS CID or encoded proof)
   * @param flowStake - Amount of $FLOW to stake on this proposal
   */
  async proposeSlash(
    target: `0x${string}`,
    evidence: `0x${string}`,
    flowStake: bigint,
  ): Promise<ProposalResult> {
    // For slash proposals, the target address is padded to bytes32 as vaultId
    // and the evidence is passed as data
    const vaultId = target.padEnd(66, "0") as `0x${string}`;
    return this.submitProposal(vaultId, "slash", evidence, flowStake);
  }

  /**
   * Propose grouping similar vaults.
   *
   * @param vaultId - Primary vault
   * @param groupData - Encoded data about which vaults to group
   * @param flowStake - Amount of $FLOW to stake on this proposal
   */
  async proposeGroup(
    vaultId: `0x${string}`,
    groupData: `0x${string}`,
    flowStake: bigint,
  ): Promise<ProposalResult> {
    return this.submitProposal(vaultId, "group", groupData, flowStake);
  }

  /**
   * Execute a proposal after its challenge window has passed.
   *
   * @param proposalId - The proposal to execute
   */
  async executeProposal(proposalId: number): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "executeProposal",
        args: [BigInt(proposalId)],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new ProposalError(`Failed to execute proposal ${proposalId}`, {
        cause: error instanceof Error ? error : undefined,
        details: "The challenge window may still be open, or the proposal may have been challenged/vetoed",
      });
    }
  }

  /**
   * Get a specific proposal by ID.
   */
  async getProposal(proposalId: number): Promise<Proposal> {
    try {
      const raw = await this.publicClient.readContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "getProposal",
        args: [BigInt(proposalId)],
      });

      return this.parseProposal(raw as Record<string, unknown>);
    } catch (error) {
      throw new ProposalError(`Failed to get proposal ${proposalId}`, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Get all pending proposals (status = Pending).
   */
  async getPendingProposals(): Promise<Proposal[]> {
    try {
      const total = await this.publicClient.readContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "totalProposals",
      }) as bigint;

      const pending: Proposal[] = [];
      const count = Number(total);

      for (let i = 0; i < count; i++) {
        const raw = await this.publicClient.readContract({
          address: this.contracts.steward,
          abi: STEWARD_ABI,
          functionName: "getProposal",
          args: [BigInt(i)],
        });

        const proposal = this.parseProposal(raw as Record<string, unknown>);
        if (proposal.status === "pending") {
          pending.push(proposal);
        }
      }

      return pending;
    } catch (error) {
      throw new ProposalError("Failed to fetch pending proposals", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Internal: submit a proposal to the Steward contract.
   * Handles FLOW token approval + proposal submission.
   */
  private async submitProposal(
    vaultId: `0x${string}`,
    actionType: "boost" | "slash" | "group",
    data: `0x${string}`,
    flowStake: bigint,
  ): Promise<ProposalResult> {
    try {
      // Step 1: Approve the Steward contract to spend FLOW
      await this.walletClient.writeContract({
        address: this.contracts.flowToken,
        abi: FLOW_TOKEN_ABI,
        functionName: "approve",
        args: [this.contracts.steward, flowStake],
        account: this.account,
        chain: this.walletClient.chain,
      });

      // Step 2: Submit the proposal
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "propose",
        args: [
          vaultId,
          actionTypeToUint8(actionType),
          data,
          flowStake,
        ],
        account: this.account,
        chain: this.walletClient.chain,
      });

      // Step 3: Get the proposal ID from the total count
      // (the new proposal is at index totalProposals - 1)
      const total = await this.publicClient.readContract({
        address: this.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "totalProposals",
      }) as bigint;

      const proposalId = Number(total) - 1;

      return { proposalId, txHash };
    } catch (error) {
      throw new ProposalError(
        `Failed to submit ${actionType} proposal`,
        {
          cause: error instanceof Error ? error : undefined,
          details: `vaultId: ${vaultId}, flowStake: ${flowStake}`,
        },
      );
    }
  }

  private parseProposal(raw: Record<string, unknown>): Proposal {
    const values = Object.values(raw);
    const [
      id, proposer, vaultId, actionType, data,
      flowStaked, status, challengeUntil,
      challenger, challengeStake, createdAt,
    ] = values as [
      bigint, `0x${string}`, `0x${string}`, number, `0x${string}`,
      bigint, number, bigint,
      `0x${string}`, bigint, bigint,
    ];

    const zeroAddr = "0x0000000000000000000000000000000000000000" as `0x${string}`;

    return {
      id: Number(id),
      proposer,
      vaultId,
      actionType: mapActionType(actionType),
      data,
      flowStaked,
      status: mapProposalStatus(status),
      challengeUntil: Number(challengeUntil),
      challenger: challenger === zeroAddr ? null : challenger,
      challengeStake,
      createdAt: Number(createdAt),
    };
  }
}
