/**
 * Vault types — on-chain vault representation.
 */

export type VaultStatus = "open" | "hot" | "locked" | "resolved" | "disputed";
export type VaultOutcome = "pending" | "yes" | "no";
export type OptionType = "momentum" | "performance" | "threshold" | "timing" | "swing";
export type HotSeverity = "warm" | "hot" | "critical";

export interface VaultState {
  id: `0x${string}`;
  option: string;
  optionType: OptionType;
  creator: `0x${string}`;
  noTotal: bigint;
  yesTotal: bigint;
  noCurveK: bigint;
  yesCurveK: bigint;
  status: VaultStatus;
  hotUntil: number;
  hotSeverity: HotSeverity;
  createdAt: number;
  expiresAt: number;
  outcome: VaultOutcome;
  proofCid: `0x${string}`;
  resolver: `0x${string}`;
  challengeUntil: number;
  creatorSideYes: boolean;
}

export interface Position {
  yesShares: bigint;
  noShares: bigint;
  yesDeposited: bigint;
  noDeposited: bigint;
  withdrawn: boolean;
}

export interface VaultSummary {
  id: `0x${string}`;
  option: string;
  optionType: OptionType;
  status: VaultStatus;
  yesTotal: bigint;
  noTotal: bigint;
  expiresAt: number;
  outcome: VaultOutcome;
}
