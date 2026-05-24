/**
 * Chain configuration and contract addresses.
 *
 * ABIs are not included in this package for the hackathon.
 * They will be generated from Solidity contracts post-deployment
 * and added to an abi/ subdirectory. For now, this module exports
 * chain config and address types only.
 */

export const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  usdc: "0x3600000000000000000000000000000000000000" as `0x${string}`,
} as const;

export type ChainConfig = typeof ARC_TESTNET;

/** Contract addresses — populated after deployment */
export interface ContractAddresses {
  vault: `0x${string}`;
  flowToken: `0x${string}`;
  protocolLP: `0x${string}`;
  agentRegistry: `0x${string}`;
  observerRegistry: `0x${string}`;
  steward: `0x${string}`;
  usdc: `0x${string}`;
}
