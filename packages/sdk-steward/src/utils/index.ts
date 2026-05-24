/**
 * Internal utilities for the steward SDK.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Transport,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET } from "@flowstream/types";

/** Arc testnet chain definition for viem */
export const arcTestnet: Chain = {
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_TESTNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_TESTNET.explorer,
    },
  },
};

/**
 * Create a viem public client for reading chain state.
 */
export function createArcPublicClient(rpcUrl?: string): PublicClient {
  return createPublicClient({
    chain: arcTestnet,
    transport: http(rpcUrl ?? ARC_TESTNET.rpcUrl),
  });
}

/**
 * Create a viem wallet client for writing transactions.
 * Accepts either a private key hex string or an existing WalletClient.
 */
export function createArcWalletClient(
  wallet: `0x${string}` | WalletClient,
  rpcUrl?: string,
): { walletClient: WalletClient; account: Account } {
  if (typeof wallet !== "string") {
    // Already a WalletClient — extract account
    const account = wallet.account;
    if (!account) {
      throw new Error("WalletClient must have an account");
    }
    return { walletClient: wallet, account };
  }

  const account = privateKeyToAccount(wallet);
  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(rpcUrl ?? ARC_TESTNET.rpcUrl),
  });
  return { walletClient, account };
}

/**
 * Map on-chain enum values to their TypeScript equivalents.
 */
export function mapStewardTier(tier: number): "community" | "inHouse" {
  return tier === 0 ? "community" : "inHouse";
}

export function mapActionType(actionType: number): "boost" | "slash" | "group" {
  const map = { 0: "boost", 1: "slash", 2: "group" } as const;
  return map[actionType as keyof typeof map] ?? "boost";
}

export function mapProposalStatus(
  status: number,
): "pending" | "challenged" | "executed" | "vetoed" {
  const map = {
    0: "pending",
    1: "challenged",
    2: "executed",
    3: "vetoed",
  } as const;
  return map[status as keyof typeof map] ?? "pending";
}

export function mapVaultStatus(
  status: number,
): "open" | "hot" | "locked" | "resolved" | "disputed" {
  const map = {
    0: "open",
    1: "hot",
    2: "locked",
    3: "resolved",
    4: "disputed",
  } as const;
  return map[status as keyof typeof map] ?? "open";
}

export function mapVaultOutcome(outcome: number): "pending" | "yes" | "no" {
  const map = { 0: "pending", 1: "yes", 2: "no" } as const;
  return map[outcome as keyof typeof map] ?? "pending";
}

export function mapHotSeverity(
  severity: number,
): "warm" | "hot" | "critical" {
  const map = { 0: "warm", 1: "hot", 2: "critical" } as const;
  return map[severity as keyof typeof map] ?? "warm";
}

/**
 * Convert a raw on-chain vault tuple to a VaultState object.
 */
export function parseVaultData(raw: readonly unknown[]): import("@flowstream/types").VaultState {
  // VaultData struct fields in order from Vault.sol:
  // id, option, optionType, creator, noTotal, yesTotal,
  // noCurveK, yesCurveK, status, hotUntil, hotSeverity,
  // createdAt, expiresAt, outcome, proofCid, resolver, challengeUntil
  const [
    id, option, optionType, creator,
    noTotal, yesTotal, noCurveK, yesCurveK,
    status, hotUntil, hotSeverity,
    createdAt, expiresAt, outcome, proofCid, resolver, challengeUntil,
  ] = raw as [
    `0x${string}`, string, number, `0x${string}`,
    bigint, bigint, bigint, bigint,
    number, bigint, number,
    bigint, bigint, number, `0x${string}`, `0x${string}`, bigint,
  ];

  return {
    id,
    option,
    optionType: (["momentum", "performance", "threshold", "timing", "swing"] as const)[
      optionType
    ] ?? "momentum",
    creator,
    noTotal,
    yesTotal,
    noCurveK,
    yesCurveK,
    status: mapVaultStatus(status),
    hotUntil: Number(hotUntil),
    hotSeverity: mapHotSeverity(hotSeverity),
    createdAt: Number(createdAt),
    expiresAt: Number(expiresAt),
    outcome: mapVaultOutcome(outcome),
    proofCid,
    resolver,
    challengeUntil: Number(challengeUntil),
  };
}
