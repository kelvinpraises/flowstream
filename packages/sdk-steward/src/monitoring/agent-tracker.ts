/**
 * AgentTracker — monitors bookmaker agents' track records.
 *
 * Tracks agent behavior across vaults to identify:
 * - Agents that consistently create bad vaults (resolved against their side)
 * - Agents with suspiciously high loss rates
 * - Agents that might be manipulating markets
 *
 * When an agent's track record is poor enough, the steward can propose a slash.
 */

import type { PublicClient } from "viem";
import type { ContractAddresses, AgentReputation } from "@flowstream/types";
import type { AgentTrackRecord } from "../types.js";
import { MonitoringError } from "../errors.js";

/** ABI fragments for AgentRegistry reads */
const AGENT_REGISTRY_ABI = [
  {
    name: "isRegistered",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getReputation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      { name: "wins", type: "uint256" },
      { name: "losses", type: "uint256" },
      { name: "vaultsCreated", type: "uint256" },
      { name: "accuracy", type: "uint256" },
    ],
  },
] as const;

/** Below this accuracy threshold (0-10000 bps), an agent is considered suspicious */
const SUSPICIOUS_ACCURACY_BPS = 3000; // 30%

/** Minimum number of resolved vaults before flagging (avoid false positives) */
const MIN_VAULTS_FOR_ASSESSMENT = 3;

export class AgentTracker {
  private publicClient: PublicClient;
  private contracts: ContractAddresses;

  /** Local cache of agent track records */
  private trackRecords: Map<`0x${string}`, AgentTrackRecord> = new Map();

  constructor(publicClient: PublicClient, contracts: ContractAddresses) {
    this.publicClient = publicClient;
    this.contracts = contracts;
  }

  /**
   * Fetch an agent's on-chain reputation and assess their track record.
   */
  async getTrackRecord(
    agentAddress: `0x${string}`,
  ): Promise<AgentTrackRecord> {
    try {
      const isRegistered = await this.publicClient.readContract({
        address: this.contracts.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "isRegistered",
        args: [agentAddress],
      });

      if (!isRegistered) {
        return {
          address: agentAddress,
          vaultsCreated: 0,
          correctResolutions: 0,
          incorrectResolutions: 0,
          accuracy: 0,
          suspicious: false,
        };
      }

      const [wins, losses, vaultsCreated, accuracyBps] =
        (await this.publicClient.readContract({
          address: this.contracts.agentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getReputation",
          args: [agentAddress],
        })) as [bigint, bigint, bigint, bigint];

      const totalResolved = Number(wins) + Number(losses);
      const accuracy = totalResolved > 0 ? Number(wins) / totalResolved : 0;
      const suspicious =
        totalResolved >= MIN_VAULTS_FOR_ASSESSMENT &&
        Number(accuracyBps) < SUSPICIOUS_ACCURACY_BPS;

      const record: AgentTrackRecord = {
        address: agentAddress,
        vaultsCreated: Number(vaultsCreated),
        correctResolutions: Number(wins),
        incorrectResolutions: Number(losses),
        accuracy,
        suspicious,
      };

      // Cache the result
      this.trackRecords.set(agentAddress, record);

      return record;
    } catch (error) {
      throw new MonitoringError(
        `Failed to fetch track record for ${agentAddress}`,
        {
          cause: error instanceof Error ? error : undefined,
          details: "Could not read agent reputation from AgentRegistry",
        },
      );
    }
  }

  /**
   * Check a list of agents and return those flagged as suspicious.
   */
  async findSuspiciousAgents(
    addresses: `0x${string}`[],
  ): Promise<AgentTrackRecord[]> {
    const suspicious: AgentTrackRecord[] = [];

    for (const addr of addresses) {
      const record = await this.getTrackRecord(addr);
      if (record.suspicious) {
        suspicious.push(record);
      }
    }

    return suspicious;
  }

  /**
   * Record a local observation about an agent's vault outcome.
   * This supplements on-chain data with the steward's own observations.
   */
  recordOutcome(
    agentAddress: `0x${string}`,
    correct: boolean,
  ): void {
    const existing = this.trackRecords.get(agentAddress);
    if (existing) {
      if (correct) {
        existing.correctResolutions++;
      } else {
        existing.incorrectResolutions++;
      }
      const total =
        existing.correctResolutions + existing.incorrectResolutions;
      existing.accuracy =
        total > 0 ? existing.correctResolutions / total : 0;
      existing.suspicious =
        total >= MIN_VAULTS_FOR_ASSESSMENT && existing.accuracy < 0.3;
    } else {
      this.trackRecords.set(agentAddress, {
        address: agentAddress,
        vaultsCreated: 0,
        correctResolutions: correct ? 1 : 0,
        incorrectResolutions: correct ? 0 : 1,
        accuracy: correct ? 1 : 0,
        suspicious: false,
      });
    }
  }

  /**
   * Get all cached track records.
   */
  getAllRecords(): AgentTrackRecord[] {
    return Array.from(this.trackRecords.values());
  }

  /**
   * Clear the local track record cache.
   */
  clearCache(): void {
    this.trackRecords.clear();
  }
}
