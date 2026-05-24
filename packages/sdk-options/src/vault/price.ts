/**
 * Off-chain bonding curve price calculator.
 *
 * Mirrors the on-chain _getSharePrice formula in Vault.sol.
 * Useful for UI price previews without hitting the chain.
 *
 * Formulas (from Vault.sol):
 *   YES: basePrice * (1 + timeElapsed / duration) * (1 + yesTotal / k) * hotMultiplier
 *   NO:  basePrice * (1 + yesTotal / k) * hotMultiplier
 *
 * All calculations use bigint arithmetic with 1e6 scaling for precision,
 * matching the Solidity implementation exactly.
 */

import type { PriceParams } from "../types.js";

/** Default base share price: 0.10 USDC = 100_000 raw (6 decimals) */
const DEFAULT_BASE_PRICE = 100_000n;

/** Precision scaling factor (matches Solidity 1e6) */
const SCALE = 1_000_000n;

/**
 * Calculate the current YES share price off-chain.
 *
 * @param params - Price calculation parameters
 * @param nowSeconds - Current time in unix seconds (default: Date.now()/1000)
 * @returns Share price in raw USDC (6 decimals)
 */
export function calculateYesPrice(
  params: PriceParams,
  nowSeconds?: number,
): bigint {
  const now = BigInt(nowSeconds ?? Math.floor(Date.now() / 1000));
  const base = params.basePrice > 0n ? params.basePrice : DEFAULT_BASE_PRICE;

  const createdAt = BigInt(params.createdAt);
  const expiresAt = BigInt(params.expiresAt);

  // Time factor: 1 + elapsed / duration
  const elapsed = now > createdAt ? now - createdAt : 0n;
  const duration = expiresAt - createdAt;
  const timeFactor = duration > 0n
    ? SCALE + (elapsed * SCALE) / duration
    : SCALE;

  // Volume factor: 1 + yesTotal / k
  const volumeFactor = params.yesCurveK > 0n
    ? SCALE + (params.yesTotal * SCALE) / params.yesCurveK
    : SCALE;

  const hotMul = BigInt(params.hotMultiplier > 0 ? params.hotMultiplier : 1);

  return (base * timeFactor * volumeFactor * hotMul) / (SCALE * SCALE);
}

/**
 * Calculate the current NO share price off-chain.
 *
 * @param params - Price calculation parameters
 * @returns Share price in raw USDC (6 decimals)
 */
export function calculateNoPrice(params: PriceParams): bigint {
  const base = params.basePrice > 0n ? params.basePrice : DEFAULT_BASE_PRICE;

  // Volume factor: 1 + yesTotal / k (contrarian signal)
  const volumeFactor = params.noCurveK > 0n
    ? SCALE + (params.yesTotal * SCALE) / params.noCurveK
    : SCALE;

  const hotMul = BigInt(params.hotMultiplier > 0 ? params.hotMultiplier : 1);

  return (base * volumeFactor * hotMul) / SCALE;
}

/**
 * Calculate how many shares a given USDC amount would buy.
 *
 * @param amount - USDC amount in raw units (6 decimals)
 * @param price - Current share price in raw USDC (6 decimals)
 * @returns Number of shares (scaled by 1e6)
 */
export function calculateShares(amount: bigint, price: bigint): bigint {
  if (price <= 0n) {
    return 0n;
  }
  return (amount * SCALE) / price;
}

/**
 * Get the hot period multiplier from severity.
 *
 * @param severity - Hot severity level
 * @param isHot - Whether the vault is currently in a hot period
 * @returns Multiplier (1 = normal, 2 = warm, 3 = hot, 5 = critical)
 */
export function getHotMultiplier(
  severity: "warm" | "hot" | "critical",
  isHot: boolean,
): number {
  if (!isHot) return 1;
  switch (severity) {
    case "warm":
      return 2;
    case "hot":
      return 3;
    case "critical":
      return 5;
    default:
      return 1;
  }
}

/**
 * Calculate effective multiplier for a stream.
 *
 * The multiplier represents the potential return ratio.
 * E.g., 2.3x means streaming 1 USDC could return 2.3 USDC if you win.
 *
 * @param ownSideTotal - Total USDC on the user's side
 * @param otherSideTotal - Total USDC on the opposing side
 * @returns Multiplier as a number (e.g., 2.3)
 */
export function calculateMultiplier(
  ownSideTotal: bigint,
  otherSideTotal: bigint,
): number {
  if (ownSideTotal === 0n) return 0;
  // multiplier = 1 + (otherSide / ownSide)
  // Using Number conversion at the end since this is a display value
  return 1 + Number(otherSideTotal) / Number(ownSideTotal);
}
