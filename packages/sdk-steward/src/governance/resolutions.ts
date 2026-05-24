/**
 * Resolutions — submit and confirm vault resolutions on-chain.
 *
 * Uses Vault.sol:
 * - resolve(vaultId, outcome, proofCid) — submit resolution with IPFS proof
 * - finalize(vaultId) — finalize after challenge window passes
 *
 * Stewards can:
 * 1. Submit resolutions when they observe resolution-relevant events
 * 2. Confirm resolutions by not challenging (passive)
 * 3. Finalize resolutions after the challenge window passes
 */

import type { PublicClient, WalletClient, Account } from "viem";
import type { ContractAddresses } from "@flowstream/types";
import { ResolutionError } from "../errors.js";

/** ABI for Vault resolution operations */
const VAULT_ABI = [
  {
    name: "resolve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "outcome", type: "uint8" },
      { name: "proofCid", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "finalize",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [],
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

/** Map outcome string to Solidity enum value */
function outcomeToUint8(outcome: "yes" | "no"): number {
  return outcome === "yes" ? 1 : 2;
}

export class ResolutionManager {
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
   * Submit a resolution for a vault.
   *
   * The steward asserts that the outcome is known and provides
   * an IPFS proof CID (typically an observation batch containing
   * the resolution-relevant event).
   *
   * This opens a challenge window. If unchallenged, the resolution
   * can be finalized after the window passes.
   *
   * @param vaultId - The vault to resolve
   * @param outcome - "yes" or "no"
   * @param proofCid - IPFS CID of the proof (bytes32)
   */
  async submitResolution(
    vaultId: `0x${string}`,
    outcome: "yes" | "no",
    proofCid: `0x${string}`,
  ): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.vault,
        abi: VAULT_ABI,
        functionName: "resolve",
        args: [vaultId, outcomeToUint8(outcome), proofCid],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new ResolutionError(
        `Failed to submit resolution for vault ${vaultId}`,
        {
          cause: error instanceof Error ? error : undefined,
          details:
            "The vault may not be in open/hot status, or a resolution may already be pending",
        },
      );
    }
  }

  /**
   * Finalize a vault resolution after the challenge window has passed.
   *
   * This triggers payout: winning side receives losing pool (minus haircut),
   * losers receive $FLOW tokens, haircut goes to ProtocolLP.
   *
   * @param vaultId - The vault to finalize
   */
  async confirmResolution(
    vaultId: `0x${string}`,
  ): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.vault,
        abi: VAULT_ABI,
        functionName: "finalize",
        args: [vaultId],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new ResolutionError(
        `Failed to finalize vault ${vaultId}`,
        {
          cause: error instanceof Error ? error : undefined,
          details:
            "The vault may not be in locked status, or the challenge window may still be open",
        },
      );
    }
  }

  /**
   * Check if a vault is ready for finalization.
   *
   * A vault is finalizable when:
   * - Status is "locked" (resolution submitted, not disputed)
   * - Challenge window has expired
   */
  async isReadyToFinalize(vaultId: `0x${string}`): Promise<boolean> {
    try {
      const rawVault = await this.publicClient.readContract({
        address: this.contracts.vault,
        abi: VAULT_ABI,
        functionName: "getVault",
        args: [vaultId],
      });

      const values = Object.values(rawVault as Record<string, unknown>);
      // status is at index 8, challengeUntil is at index 16
      const status = values[8] as number;
      const challengeUntil = Number(values[16] as bigint);
      const now = Math.floor(Date.now() / 1000);

      // Status must be Locked (2) and challenge window must have passed
      return status === 2 && now > challengeUntil;
    } catch {
      return false;
    }
  }
}
