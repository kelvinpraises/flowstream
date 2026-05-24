/**
 * ResolutionWatcher — watches the observation feed for resolution-relevant events
 * and cross-references submitted proofs against own observation data.
 *
 * Responsibilities:
 * - Listen for score_change events that may trigger vault resolutions
 * - Track pending resolutions on-chain
 * - Cross-reference submitted proof CIDs with own observation buffer
 * - Auto-submit resolution proofs when configured
 */

import type { PublicClient } from "viem";
import type {
  ContractAddresses,
  ObservationFrame,
  ObservationEvent,
  VaultState,
} from "@flowstream/types";
import type { PendingResolution } from "../types.js";
import { parseVaultData, mapVaultOutcome } from "../utils/index.js";
import { ResolutionError } from "../errors.js";

/** ABI fragments for vault resolution reads */
const VAULT_ABI = [
  {
    name: "totalVaults",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "vaultIds",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "getVault",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "bytes32" },
          { name: "option", type: "string" },
          { name: "optionType", type: "uint8" },
          { name: "creator", type: "address" },
          { name: "noTotal", type: "uint256" },
          { name: "yesTotal", type: "uint256" },
          { name: "noCurveK", type: "uint256" },
          { name: "yesCurveK", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "hotUntil", type: "uint256" },
          { name: "hotSeverity", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "outcome", type: "uint8" },
          { name: "proofCid", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "challengeUntil", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export class ResolutionWatcher {
  private publicClient: PublicClient;
  private contracts: ContractAddresses;

  /** Buffer of recent observation frames for cross-referencing */
  private observationBuffer: ObservationFrame[] = [];

  /** Max frames to keep in the buffer */
  private maxBufferSize = 1000;

  /** Track events we've seen for deduplication */
  private seenEvents: Set<string> = new Set();

  constructor(publicClient: PublicClient, contracts: ContractAddresses) {
    this.publicClient = publicClient;
    this.contracts = contracts;
  }

  /**
   * Add an observation frame to the internal buffer.
   * Called by the main client when frames arrive from the WebSocket feed.
   */
  addFrame(frame: ObservationFrame): void {
    this.observationBuffer.push(frame);

    // Track events for later cross-referencing
    for (const event of frame.events) {
      const key = `${event.type}:${event.side}:${event.at}`;
      this.seenEvents.add(key);
    }

    // Keep buffer bounded
    if (this.observationBuffer.length > this.maxBufferSize) {
      this.observationBuffer = this.observationBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Check if any score_change events have occurred that might resolve vaults.
   * Returns a list of events that are resolution-relevant.
   */
  getRecentScoreChanges(): ObservationEvent[] {
    const events: ObservationEvent[] = [];
    for (const frame of this.observationBuffer) {
      for (const event of frame.events) {
        if (event.type === "score_change") {
          events.push(event);
        }
      }
    }
    return events;
  }

  /**
   * Scan for vaults in "locked" status (resolution submitted, challenge window open).
   * Cross-reference the submitted proof with our own observations.
   */
  async getPendingResolutions(): Promise<PendingResolution[]> {
    try {
      const totalVaults = await this.publicClient.readContract({
        address: this.contracts.vault,
        abi: VAULT_ABI,
        functionName: "totalVaults",
      }) as bigint;

      const pending: PendingResolution[] = [];
      const count = Number(totalVaults);
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < count; i++) {
        const vaultId = await this.publicClient.readContract({
          address: this.contracts.vault,
          abi: VAULT_ABI,
          functionName: "vaultIds",
          args: [BigInt(i)],
        }) as `0x${string}`;

        const rawVault = await this.publicClient.readContract({
          address: this.contracts.vault,
          abi: VAULT_ABI,
          functionName: "getVault",
          args: [vaultId],
        });

        const vault = parseVaultData(
          Object.values(rawVault as Record<string, unknown>),
        );

        // Only interested in locked vaults within challenge window
        if (vault.status !== "locked") continue;
        if (vault.challengeUntil <= now) continue;

        const outcome = vault.outcome === "yes" ? "yes" as const : "no" as const;

        // Cross-reference: check if our observations agree with the outcome
        const observationMatch = this.verifyOutcome(vault);

        pending.push({
          vaultId,
          outcome,
          proofCid: vault.proofCid,
          resolver: vault.resolver,
          challengeUntil: vault.challengeUntil,
          observationMatch,
        });
      }

      return pending;
    } catch (error) {
      throw new ResolutionError("Failed to scan pending resolutions", {
        cause: error instanceof Error ? error : undefined,
        details: "Could not read vault resolution state from chain",
      });
    }
  }

  /**
   * Verify whether a vault's resolution outcome matches our observation data.
   *
   * For score_change-dependent vaults (momentum, threshold, timing):
   * - Check if we observed score changes that match the claimed outcome
   *
   * Returns null if we don't have enough observation data to verify.
   */
  verifyOutcome(vault: VaultState): boolean | null {
    if (this.observationBuffer.length === 0) {
      return null; // Not enough data
    }

    // Get the latest score from our observations
    const latestFrame = this.observationBuffer[this.observationBuffer.length - 1];
    if (!latestFrame) return null;

    // Check if there were score changes in our buffer
    const scoreChanges = this.getRecentScoreChanges();

    // For now: simple heuristic — if the vault says YES resolved and we
    // saw score_change events, that's consistent. If vault says NO and
    // we saw no score changes, that's consistent.
    // More sophisticated verification would parse the vault option text
    // and match it against specific event data.
    if (scoreChanges.length === 0 && vault.outcome === "yes") {
      // Vault says YES but we saw no score changes — suspicious
      return false;
    }

    if (scoreChanges.length > 0 && vault.outcome === "no") {
      // Vault says NO but we saw score changes — might be suspicious
      // (depends on what the option was about)
      return null; // Ambiguous without deeper analysis
    }

    // Default: our observations don't conflict
    return true;
  }

  /**
   * Get the current score from our observation buffer.
   */
  getCurrentScore(): [number, number] | null {
    if (this.observationBuffer.length === 0) return null;
    const latest = this.observationBuffer[this.observationBuffer.length - 1];
    return latest?.score ?? null;
  }

  /**
   * Get the current momentum from our observation buffer.
   */
  getCurrentMomentum(): number | null {
    if (this.observationBuffer.length === 0) return null;
    const latest = this.observationBuffer[this.observationBuffer.length - 1];
    return latest?.momentum ?? null;
  }

  /**
   * Clear the observation buffer and event tracking.
   */
  reset(): void {
    this.observationBuffer = [];
    this.seenEvents.clear();
  }

  /**
   * Get the number of frames in the buffer.
   */
  get bufferSize(): number {
    return this.observationBuffer.length;
  }
}
