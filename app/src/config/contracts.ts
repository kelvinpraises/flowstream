/**
 * Contract addresses + chain config, read from env.
 * All hooks import from here. After deployment, just update .env.
 */

import { createPublicClient, http, defineChain, type Address } from 'viem'

export const arcTestnet = defineChain({
  id: Number(import.meta.env.VITE_CHAIN_ID || 5042002),
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [import.meta.env.VITE_ARC_RPC_URL || 'https://testnet-rpc.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet-scan.arc.network' } },
})

const ZERO = '0x0000000000000000000000000000000000000000' as Address

export const contracts = {
  vault: (import.meta.env.VITE_VAULT_ADDRESS || ZERO) as Address,
  flowToken: (import.meta.env.VITE_FLOW_TOKEN_ADDRESS || ZERO) as Address,
  agentRegistry: (import.meta.env.VITE_AGENT_REGISTRY_ADDRESS || ZERO) as Address,
  observerRegistry: (import.meta.env.VITE_OBSERVER_REGISTRY_ADDRESS || ZERO) as Address,
  steward: (import.meta.env.VITE_STEWARD_ADDRESS || ZERO) as Address,
  protocolLP: (import.meta.env.VITE_PROTOCOL_LP_ADDRESS || ZERO) as Address,
  usdc: (import.meta.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000') as Address,
} as const

/** True when contracts are deployed (not zero addresses) */
export function isDeployed(): boolean {
  return contracts.vault !== ZERO
}

/** Shared public client for read operations */
export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

// ─── ABIs (minimal fragments for reads) ───

export const AGENT_REGISTRY_ABI = [
  {
    type: 'function', name: 'getAgent',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      { name: 'agentAddress', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'agentType', type: 'uint8' },
      { name: 'vaultsCreated', type: 'uint256' },
      { name: 'wins', type: 'uint256' },
      { name: 'losses', type: 'uint256' },
      { name: 'accuracy', type: 'uint256' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getAgentList',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'totalAgents',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const VAULT_ABI = [
  {
    type: 'function', name: 'vaults',
    inputs: [{ name: 'vaultId', type: 'bytes32' }],
    outputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'option', type: 'string' },
      { name: 'optionType', type: 'uint8' },
      { name: 'creator', type: 'address' },
      { name: 'noTotal', type: 'uint256' },
      { name: 'yesTotal', type: 'uint256' },
      { name: 'noCurveK', type: 'uint256' },
      { name: 'yesCurveK', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'hotUntil', type: 'uint256' },
      { name: 'hotSeverity', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'outcome', type: 'uint8' },
      { name: 'proofCid', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'challengeUntil', type: 'uint256' },
      { name: 'creatorSideYes', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'totalVaults',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const FLOW_TOKEN_ABI = [
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'totalStaked',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const PROTOCOL_LP_ABI = [
  {
    type: 'function', name: 'totalDeposited',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'surplus',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const
