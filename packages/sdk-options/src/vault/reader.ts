/**
 * Vault reader — read vault state from Arc chain.
 *
 * All methods are read-only (view calls). No wallet required.
 * Ported from chain.py ChainClient read methods.
 */

import type { PublicClient } from "viem";
import type {
  VaultState,
  VaultSummary,
  VaultStatus,
  VaultOutcome,
  OptionType,
  HotSeverity,
  Position,
} from "@flowstream/types";
import { VAULT_ABI } from "../abi.js";
import { VaultNotFoundError, ContractCallError } from "../errors.js";

// --- Enum maps (mirrors chain.py VAULT_STATUS / VAULT_OUTCOME / OPTION_TYPES) ---

const STATUS_MAP: Record<number, VaultStatus> = {
  0: "open",
  1: "hot",
  2: "locked",
  3: "resolved",
  4: "disputed",
};

const OUTCOME_MAP: Record<number, VaultOutcome> = {
  0: "pending",
  1: "yes",
  2: "no",
};

const OPTION_TYPE_MAP: Record<number, OptionType> = {
  0: "momentum",
  1: "performance",
  2: "threshold",
  3: "timing",
  4: "swing",
};

const SEVERITY_MAP: Record<number, HotSeverity> = {
  0: "warm",
  1: "hot",
  2: "critical",
};

/**
 * Read vault state from the on-chain Vault contract.
 */
export class VaultReader {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly vaultAddress: `0x${string}`,
  ) {}

  /**
   * Get a single vault by ID.
   *
   * @param vaultId - The vault's bytes32 identifier
   * @returns Full vault state
   * @throws VaultNotFoundError if the vault does not exist
   */
  async getVault(vaultId: `0x${string}`): Promise<VaultState> {
    try {
      const raw = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "getVault",
        args: [vaultId],
      });

      return parseVaultData(raw);
    } catch (err) {
      throw new ContractCallError("getVault", err instanceof Error ? err : undefined);
    }
  }

  /**
   * List vaults with optional filters.
   *
   * Reads the vaultIds array and fetches each vault's data.
   * Returns most recent vaults first.
   *
   * @param opts - Optional filters: status, limit
   * @returns Array of vault summaries
   */
  async listVaults(opts?: {
    status?: VaultStatus;
    limit?: number;
  }): Promise<VaultSummary[]> {
    const limit = opts?.limit ?? 20;

    try {
      const total = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "totalVaults",
      });

      const count = Number(total);
      const fetchCount = Math.min(count, limit);
      const summaries: VaultSummary[] = [];

      // Iterate from newest to oldest
      for (let i = count - 1; i >= 0 && summaries.length < fetchCount; i--) {
        const vid = await this.publicClient.readContract({
          address: this.vaultAddress,
          abi: VAULT_ABI,
          functionName: "vaultIds",
          args: [BigInt(i)],
        });

        const raw = await this.publicClient.readContract({
          address: this.vaultAddress,
          abi: VAULT_ABI,
          functionName: "getVault",
          args: [vid],
        });

        const vault = parseVaultData(raw);

        // Apply status filter
        if (opts?.status && vault.status !== opts.status) {
          continue;
        }

        summaries.push({
          id: vault.id,
          option: vault.option,
          optionType: vault.optionType,
          status: vault.status,
          yesTotal: vault.yesTotal,
          noTotal: vault.noTotal,
          expiresAt: vault.expiresAt,
          outcome: vault.outcome,
        });
      }

      return summaries;
    } catch (err) {
      throw new ContractCallError("listVaults", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Get current share price for a vault side.
   *
   * @param vaultId - Vault identifier
   * @param yesSide - true for YES side price, false for NO side price
   * @returns Share price in raw USDC (6 decimals)
   */
  async getSharePrice(
    vaultId: `0x${string}`,
    yesSide: boolean,
  ): Promise<bigint> {
    try {
      const price = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "getSharePrice",
        args: [vaultId, yesSide],
      });

      return price;
    } catch (err) {
      throw new ContractCallError("getSharePrice", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Get a user's position in a vault.
   *
   * @param vaultId - Vault identifier
   * @param user - User address
   * @returns Position with shares, deposits, and withdrawal status
   */
  async getPosition(
    vaultId: `0x${string}`,
    user: `0x${string}`,
  ): Promise<Position> {
    try {
      const raw = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "getPosition",
        args: [vaultId, user],
      });

      return {
        yesShares: raw.yesShares,
        noShares: raw.noShares,
        yesDeposited: raw.yesDeposited,
        noDeposited: raw.noDeposited,
        withdrawn: raw.withdrawn,
      };
    } catch (err) {
      throw new ContractCallError("getPosition", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Get the total number of vaults created.
   */
  async totalVaults(): Promise<number> {
    try {
      const total = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "totalVaults",
      });
      return Number(total);
    } catch (err) {
      throw new ContractCallError("totalVaults", err instanceof Error ? err : undefined);
    }
  }
}

// -- Internal helpers --

/**
 * Parse raw vault tuple from contract into a typed VaultState.
 * Mirrors _parse_vault from chain.py.
 */
function parseVaultData(raw: {
  id: `0x${string}`;
  option: string;
  optionType: number;
  creator: `0x${string}`;
  noTotal: bigint;
  yesTotal: bigint;
  noCurveK: bigint;
  yesCurveK: bigint;
  status: number;
  hotUntil: bigint;
  hotSeverity: number;
  createdAt: bigint;
  expiresAt: bigint;
  outcome: number;
  proofCid: `0x${string}`;
  resolver: `0x${string}`;
  challengeUntil: bigint;
  creatorSideYes: boolean;
}): VaultState {
  return {
    id: raw.id,
    option: raw.option,
    optionType: OPTION_TYPE_MAP[raw.optionType] ?? "momentum",
    creator: raw.creator,
    noTotal: raw.noTotal,
    yesTotal: raw.yesTotal,
    noCurveK: raw.noCurveK,
    yesCurveK: raw.yesCurveK,
    status: STATUS_MAP[raw.status] ?? "open",
    hotUntil: Number(raw.hotUntil),
    hotSeverity: SEVERITY_MAP[raw.hotSeverity] ?? "warm",
    createdAt: Number(raw.createdAt),
    expiresAt: Number(raw.expiresAt),
    outcome: OUTCOME_MAP[raw.outcome] ?? "pending",
    proofCid: raw.proofCid,
    resolver: raw.resolver,
    challengeUntil: Number(raw.challengeUntil),
    creatorSideYes: raw.creatorSideYes,
  };
}
