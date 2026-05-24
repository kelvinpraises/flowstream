/**
 * Contract ABIs for FlowStream on-chain contracts.
 *
 * Defined as `const` arrays so viem can infer exact
 * argument and return types from the ABI at compile time.
 *
 * Source: Vault.sol, FlowToken.sol, ProtocolLP.sol
 * (translated from chain.py Python ABI dicts)
 */

// ---------- Vault ABI ----------

export const VAULT_ABI = [
  // --- Write ---
  {
    type: "function",
    name: "createVault",
    inputs: [
      { name: "option", type: "string" },
      { name: "optionType", type: "uint8" },
      { name: "duration", type: "uint256" },
      { name: "creatorStake", type: "uint256" },
      { name: "creatorSide", type: "bool" },
    ],
    outputs: [{ name: "vaultId", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "stream",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "yesSide", type: "bool" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "outcome", type: "uint8" },
      { name: "proofCid", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalize",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // --- Read ---
  {
    type: "function",
    name: "getVault",
    inputs: [{ name: "vaultId", type: "bytes32" }],
    outputs: [
      {
        name: "",
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
          { name: "creatorSideYes", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalVaults",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaultIds",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPosition",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "yesShares", type: "uint256" },
          { name: "noShares", type: "uint256" },
          { name: "yesDeposited", type: "uint256" },
          { name: "noDeposited", type: "uint256" },
          { name: "withdrawn", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSharePrice",
    inputs: [
      { name: "vaultId", type: "bytes32" },
      { name: "yesSide", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ---------- FlowToken ABI ----------

export const FLOW_TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "staked",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalStaked",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pendingRewards",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "stake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unstake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimDividends",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// ---------- ProtocolLP ABI ----------

export const PROTOCOL_LP_ABI = [
  {
    type: "function",
    name: "totalDeposited",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "surplus",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ---------- ERC-20 ABI (minimal, for USDC approve/allowance) ----------

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
