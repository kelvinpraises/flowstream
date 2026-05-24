/**
 * Formatting utilities for USDC and FLOW token amounts.
 *
 * USDC: 6 decimals. 1 USDC = 1_000_000 raw units.
 * FLOW: 18 decimals. 1 FLOW = 1_000_000_000_000_000_000 raw units.
 */

const USDC_DECIMALS = 6;
const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS);

const FLOW_DECIMALS = 18;
const FLOW_SCALE = 10n ** BigInt(FLOW_DECIMALS);

/**
 * Format raw USDC (6 decimals) as a human-readable string.
 *
 * @param raw - Raw USDC amount (bigint, 6 decimal places)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted string, e.g. "10.50"
 *
 * @example
 * ```ts
 * formatUSDC(10_500_000n) // "10.50"
 * formatUSDC(100_000n)    // "0.10"
 * formatUSDC(0n)          // "0.00"
 * ```
 */
export function formatUSDC(raw: bigint, decimals: number = 2): string {
  const whole = raw / USDC_SCALE;
  const frac = raw % USDC_SCALE;
  // Pad fractional part to 6 digits, then truncate to requested precision
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").slice(0, decimals);
  return `${whole}.${fracStr}`;
}

/**
 * Parse a human-readable USDC string to raw bigint.
 *
 * @param value - Human-readable amount, e.g. "10.50"
 * @returns Raw USDC amount (bigint, 6 decimal places)
 *
 * @example
 * ```ts
 * parseUSDC("10.50")  // 10_500_000n
 * parseUSDC("0.1")    // 100_000n
 * parseUSDC("100")    // 100_000_000n
 * ```
 */
export function parseUSDC(value: string): bigint {
  return parseFixedPoint(value, USDC_DECIMALS);
}

/**
 * Format raw FLOW (18 decimals) as a human-readable string.
 *
 * @param raw - Raw FLOW amount (bigint, 18 decimal places)
 * @param decimals - Number of decimal places to show (default: 4)
 * @returns Formatted string, e.g. "1250.0000"
 *
 * @example
 * ```ts
 * formatFLOW(1_250_000_000_000_000_000_000n) // "1250.0000"
 * formatFLOW(100_000_000_000_000_000n)       // "0.1000"
 * ```
 */
export function formatFLOW(raw: bigint, decimals: number = 4): string {
  const whole = raw / FLOW_SCALE;
  const frac = raw % FLOW_SCALE;
  const fracStr = frac.toString().padStart(FLOW_DECIMALS, "0").slice(0, decimals);
  return `${whole}.${fracStr}`;
}

/**
 * Parse a human-readable FLOW string to raw bigint.
 *
 * @param value - Human-readable amount, e.g. "100.5"
 * @returns Raw FLOW amount (bigint, 18 decimal places)
 *
 * @example
 * ```ts
 * parseFLOW("100")   // 100_000_000_000_000_000_000n
 * parseFLOW("0.5")   // 500_000_000_000_000_000n
 * ```
 */
export function parseFLOW(value: string): bigint {
  return parseFixedPoint(value, FLOW_DECIMALS);
}

/**
 * Build an Arc explorer URL for a transaction hash.
 */
export function explorerTxUrl(txHash: string): string {
  return `https://testnet.arcscan.app/tx/${txHash}`;
}

/**
 * Build an Arc explorer URL for an address.
 */
export function explorerAddressUrl(address: string): string {
  return `https://testnet.arcscan.app/address/${address}`;
}

// -- Internal helpers --

function parseFixedPoint(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (trimmed === "") {
    return 0n;
  }

  const parts = trimmed.split(".");
  const wholePart = parts[0] ?? "0";
  const fracPart = (parts[1] ?? "").slice(0, decimals).padEnd(decimals, "0");

  const whole = BigInt(wholePart) * 10n ** BigInt(decimals);
  const frac = BigInt(fracPart);

  return whole + frac;
}
