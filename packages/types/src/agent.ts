/**
 * Agent types — ERC-8004 identity and reputation.
 */

export type AgentType = "bookmaker" | "steward" | "observer";

export interface AgentIdentity {
  address: `0x${string}`;
  name: string;
  agentType: AgentType;
  registeredAt: number;
  exists: boolean;
}

export interface AgentReputation {
  wins: number;
  losses: number;
  vaultsCreated: number;
  /** Accuracy in basis points (0-10000) */
  accuracy: number;
}
