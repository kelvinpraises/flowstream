/**
 * Steward types — governance and proposal management.
 */

export type StewardTier = "community" | "inHouse";
export type ActionType = "boost" | "slash" | "group";
export type ProposalStatus = "pending" | "challenged" | "executed" | "vetoed";

export interface StewardInfo {
  address: `0x${string}`;
  name: string;
  tier: StewardTier;
  successfulProposals: number;
  registeredAt: number;
}

export interface Proposal {
  id: number;
  proposer: `0x${string}`;
  vaultId: `0x${string}`;
  actionType: ActionType;
  data: `0x${string}`;
  flowStaked: bigint;
  status: ProposalStatus;
  challengeUntil: number;
  challenger: `0x${string}` | null;
  challengeStake: bigint;
  createdAt: number;
}
