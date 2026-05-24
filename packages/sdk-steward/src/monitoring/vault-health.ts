/**
 * VaultHealthMonitor — reads vault state from chain and flags issues.
 *
 * Flags:
 * - Vaults with expired challenge windows ready for finalization
 * - Vaults in disputed state needing attention
 * - Hot vaults with active exit activity
 * - Vaults with asymmetric pools (potential manipulation)
 * - Vaults with thin liquidity but strong fundamentals (boost candidates)
 * - Expired vaults that were never resolved
 */

import type { PublicClient } from "viem";
import type { VaultState, ContractAddresses } from "@flowstream/types";
import type { VaultHealthReport, VaultHealthFlag } from "../types.js";
import { parseVaultData, mapVaultStatus } from "../utils/index.js";
import { MonitoringError } from "../errors.js";

/** ABI fragments for Vault contract reads */
const VAULT_READ_ABI = [
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

/** Minimum pool ratio before flagging as asymmetric (10:1) */
const ASYMMETRIC_THRESHOLD = 10;

/** Minimum combined liquidity before flagging as thin (10 USDC = 10e6) */
const THIN_LIQUIDITY_THRESHOLD = 10_000_000n;

export class VaultHealthMonitor {
  private publicClient: PublicClient;
  private contracts: ContractAddresses;

  constructor(publicClient: PublicClient, contracts: ContractAddresses) {
    this.publicClient = publicClient;
    this.contracts = contracts;
  }

  /**
   * Scan all vaults and produce health reports for vaults with issues.
   * Returns only vaults that have at least one flag.
   */
  async scanAll(): Promise<VaultHealthReport[]> {
    try {
      const totalVaults = await this.publicClient.readContract({
        address: this.contracts.vault,
        abi: VAULT_READ_ABI,
        functionName: "totalVaults",
      }) as bigint;

      const reports: VaultHealthReport[] = [];
      const count = Number(totalVaults);

      for (let i = 0; i < count; i++) {
        const vaultId = await this.publicClient.readContract({
          address: this.contracts.vault,
          abi: VAULT_READ_ABI,
          functionName: "vaultIds",
          args: [BigInt(i)],
        }) as `0x${string}`;

        const report = await this.checkVault(vaultId);
        if (report && report.flags.length > 0) {
          reports.push(report);
        }
      }

      return reports;
    } catch (error) {
      throw new MonitoringError("Failed to scan vaults", {
        cause: error instanceof Error ? error : undefined,
        details: "Could not read vault state from chain",
      });
    }
  }

  /**
   * Check a single vault and produce a health report.
   */
  async checkVault(vaultId: `0x${string}`): Promise<VaultHealthReport | null> {
    try {
      const rawVault = await this.publicClient.readContract({
        address: this.contracts.vault,
        abi: VAULT_READ_ABI,
        functionName: "getVault",
        args: [vaultId],
      });

      const vault = parseVaultData(
        Object.values(rawVault as Record<string, unknown>),
      );

      // Skip already-resolved vaults with no pending actions
      if (vault.status === "resolved" && vault.challengeUntil === 0) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const flags: VaultHealthFlag[] = [];

      // Check for expired challenge window (ready for finalization)
      if (
        vault.status === "locked" &&
        vault.challengeUntil > 0 &&
        now > vault.challengeUntil
      ) {
        flags.push("pending_finalization");
      }

      // Check for expired challenge window still within window
      if (
        vault.status === "locked" &&
        vault.challengeUntil > 0 &&
        now <= vault.challengeUntil
      ) {
        flags.push("expired_challenge");
      }

      // Check for disputed state
      if (vault.status === "disputed") {
        flags.push("disputed");
      }

      // Check for active hot period
      if (vault.status === "hot" && vault.hotUntil > now) {
        flags.push("hot_active");
      }

      // Check for asymmetric pools
      const poolRatio = this.calculatePoolRatio(vault);
      if (poolRatio > ASYMMETRIC_THRESHOLD || poolRatio < 1 / ASYMMETRIC_THRESHOLD) {
        flags.push("asymmetric_pool");
      }

      // Check for thin liquidity
      const totalLiquidity = vault.yesTotal + vault.noTotal;
      if (
        totalLiquidity < THIN_LIQUIDITY_THRESHOLD &&
        vault.status === "open" &&
        now < vault.expiresAt
      ) {
        flags.push("thin_liquidity");
      }

      // Check for expired but unresolved vaults
      if (
        (vault.status === "open" || vault.status === "hot") &&
        now >= vault.expiresAt
      ) {
        flags.push("expired_unresolved");
      }

      const challengeWindowRemaining =
        vault.challengeUntil > 0 ? vault.challengeUntil - now : 0;
      const expiryRemaining = vault.expiresAt - now;

      return {
        vaultId,
        vault,
        flags,
        poolRatio,
        challengeWindowRemaining,
        expiryRemaining,
      };
    } catch (error) {
      throw new MonitoringError(`Failed to check vault ${vaultId}`, {
        cause: error instanceof Error ? error : undefined,
        details: "Could not read vault data from chain",
      });
    }
  }

  /**
   * Get vaults that are ready for finalization (challenge window expired).
   */
  async getFinalizableVaults(): Promise<VaultHealthReport[]> {
    const reports = await this.scanAll();
    return reports.filter((r) => r.flags.includes("pending_finalization"));
  }

  /**
   * Get vaults with thin liquidity that might benefit from a boost.
   */
  async getBoostCandidates(): Promise<VaultHealthReport[]> {
    const reports = await this.scanAll();
    return reports.filter((r) => r.flags.includes("thin_liquidity"));
  }

  /**
   * Get vaults in disputed state needing steward attention.
   */
  async getDisputedVaults(): Promise<VaultHealthReport[]> {
    const reports = await this.scanAll();
    return reports.filter((r) => r.flags.includes("disputed"));
  }

  private calculatePoolRatio(vault: VaultState): number {
    if (vault.noTotal === 0n && vault.yesTotal === 0n) return 1;
    if (vault.noTotal === 0n) return Infinity;
    if (vault.yesTotal === 0n) return 0;
    return Number(vault.yesTotal) / Number(vault.noTotal);
  }
}
