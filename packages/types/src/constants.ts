/**
 * Protocol-wide constants.
 */

/** USDC has 6 decimals */
export const USDC_DECIMALS = 6;

/** FLOW has 18 decimals */
export const FLOW_DECIMALS = 18;

/** Default WebSocket port for observation feeds */
export const DEFAULT_WS_PORT = 8765;

/** Default observation FPS */
export const DEFAULT_FPS = 5;

/** Default IPFS batch interval in seconds */
export const DEFAULT_IPFS_INTERVAL = 30;

/** Vault base share price (0.10 USDC in raw units) */
export const BASE_SHARE_PRICE = 100_000n;

/** Challenge window in seconds */
export const CHALLENGE_WINDOW = 300; // 5 minutes

/** Max floating bets per address */
export const MAX_FLOATING_BETS = 10;

/** Arc testnet chain ID */
export const ARC_CHAIN_ID = 5042002;
