/**
 * Internal utilities for the bookmaker SDK.
 */

import { USDC_DECIMALS } from "@flowstream/types";

/**
 * Convert a human-readable USDC amount to raw 6-decimal units.
 *
 * @example usdcToRaw(10) => 10_000_000n
 */
export function usdcToRaw(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

/**
 * Convert raw USDC units to human-readable number.
 *
 * @example rawToUsdc(10_000_000n) => 10
 */
export function rawToUsdc(raw: bigint): number {
  return Number(raw) / 10 ** USDC_DECIMALS;
}

/**
 * Format raw USDC for display.
 *
 * @example formatUsdc(10_000_000n) => "10.00 USDC"
 */
export function formatUsdc(raw: bigint): string {
  return `${rawToUsdc(raw).toFixed(2)} USDC`;
}

/**
 * Simple async sleep utility.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
