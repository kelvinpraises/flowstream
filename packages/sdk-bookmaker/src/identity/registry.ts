/**
 * AgentIdentityRegistry — ERC-8004 agent registration on Arc.
 *
 * Registers the bookmaker agent on-chain with name, type, and address.
 * Reads back the agent's identity and reputation.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type {
  ContractAddresses,
  AgentIdentity,
  AgentReputation,
} from "@flowstream/types";
import { ARC_TESTNET } from "@flowstream/types";
import { RegistrationError } from "../errors.js";
import { arcTestnet } from "../vault/vault-creator.js";

// ---------------------------------------------------------------------------
// ABI fragments for AgentRegistry
// ---------------------------------------------------------------------------

const AGENT_REGISTRY_ABI = [
  {
    type: "function" as const,
    name: "registerAgent" as const,
    inputs: [
      { name: "name", type: "string" as const },
      { name: "agentType", type: "uint8" as const },
    ],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
  {
    type: "function" as const,
    name: "getAgent" as const,
    inputs: [{ name: "agent", type: "address" as const }],
    outputs: [
      { name: "agentAddress", type: "address" as const },
      { name: "name", type: "string" as const },
      { name: "agentType", type: "uint8" as const },
      { name: "vaultsCreated", type: "uint256" as const },
      { name: "wins", type: "uint256" as const },
      { name: "losses", type: "uint256" as const },
      { name: "accuracy", type: "uint256" as const },
      { name: "registeredAt", type: "uint256" as const },
      { name: "exists", type: "bool" as const },
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getReputation" as const,
    inputs: [{ name: "agent", type: "address" as const }],
    outputs: [
      { name: "wins", type: "uint256" as const },
      { name: "losses", type: "uint256" as const },
      { name: "vaultsCreated", type: "uint256" as const },
      { name: "accuracy", type: "uint256" as const },
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getAgentList" as const,
    inputs: [],
    outputs: [{ name: "", type: "address[]" as const }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getAgentsByType" as const,
    inputs: [
      { name: "filterType", type: "uint8" as const },
      { name: "limit", type: "uint256" as const },
    ],
    outputs: [
      { name: "addrs", type: "address[]" as const },
      { name: "count", type: "uint256" as const },
    ],
    stateMutability: "view" as const,
  },
] as const;

// Agent type enum to uint8
const AGENT_TYPE_MAP = {
  bookmaker: 0,
  steward: 1,
  observer: 2,
} as const;

// ---------------------------------------------------------------------------
// AgentIdentityRegistry
// ---------------------------------------------------------------------------

export class AgentIdentityRegistry {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly account: Account;
  private readonly contracts: ContractAddresses;

  constructor(
    wallet: `0x${string}` | WalletClient,
    contracts: ContractAddresses,
    rpcUrl?: string,
  ) {
    this.contracts = contracts;

    const rpc = rpcUrl ?? ARC_TESTNET.rpcUrl;
    const transport = http(rpc);

    this.publicClient = createPublicClient({
      chain: arcTestnet,
      transport,
    });

    if (typeof wallet === "string") {
      this.account = privateKeyToAccount(wallet);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: arcTestnet,
        transport,
      });
    } else {
      this.walletClient = wallet;
      if (!wallet.account) {
        throw new RegistrationError(
          "WalletClient must have an account attached",
        );
      }
      this.account = wallet.account;
    }
  }

  /** Get the agent's address */
  get address(): `0x${string}` {
    return this.account.address;
  }

  /**
   * Register this agent on-chain via ERC-8004 AgentRegistry.
   *
   * @param name - Agent display name
   * @returns Transaction hash
   */
  async register(name: string): Promise<`0x${string}`> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contracts.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "registerAgent",
        args: [name, AGENT_TYPE_MAP.bookmaker],
        account: this.account,
        chain: arcTestnet,
      });

      await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    } catch (err) {
      throw new RegistrationError(
        err instanceof Error ? err.message : "Unknown error",
        { cause: err instanceof Error ? err : undefined },
      );
    }
  }

  /**
   * Read the agent's on-chain identity.
   */
  async getIdentity(
    address?: `0x${string}`,
  ): Promise<AgentIdentity> {
    const target = address ?? this.account.address;

    const result = await this.publicClient.readContract({
      address: this.contracts.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "getAgent",
      args: [target],
    });

    // getAgent returns: (address, name, agentType, vaultsCreated, wins, losses, accuracy, registeredAt, exists)
    const agentTypeMap = ["bookmaker", "steward", "observer"] as const;

    return {
      address: result[0] as `0x${string}`,
      name: result[1] as string,
      agentType: agentTypeMap[Number(result[2])] ?? "bookmaker",
      registeredAt: Number(result[7]),
      exists: result[8] as boolean,
    };
  }

  /**
   * Read the agent's on-chain reputation.
   */
  async getReputation(
    address?: `0x${string}`,
  ): Promise<AgentReputation> {
    const target = address ?? this.account.address;

    const result = await this.publicClient.readContract({
      address: this.contracts.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "getReputation",
      args: [target],
    });

    return {
      wins: Number(result[0]),
      losses: Number(result[1]),
      vaultsCreated: Number(result[2]),
      accuracy: Number(result[3]),
    };
  }

  /**
   * Get all registered agent addresses.
   */
  async getAgentList(): Promise<`0x${string}`[]> {
    return this.publicClient.readContract({
      address: this.contracts.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "getAgentList",
    }) as Promise<`0x${string}`[]>;
  }

  /**
   * Get leaderboard: all agents with full identity + reputation.
   * Sorted by accuracy descending.
   */
  async getLeaderboard(
    filterType?: "bookmaker" | "steward" | "observer",
  ): Promise<(AgentIdentity & AgentReputation)[]> {
    const addresses = await this.getAgentList();

    const agents = await Promise.all(
      addresses.map(async (addr) => {
        const result = await this.publicClient.readContract({
          address: this.contracts.agentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getAgent",
          args: [addr],
        });

        const agentTypeMap = ["bookmaker", "steward", "observer"] as const;
        const agentType = agentTypeMap[Number(result[2])] ?? "bookmaker";

        return {
          address: result[0] as `0x${string}`,
          name: result[1] as string,
          agentType,
          registeredAt: Number(result[7]),
          exists: result[8] as boolean,
          vaultsCreated: Number(result[3]),
          wins: Number(result[4]),
          losses: Number(result[5]),
          accuracy: Number(result[6]),
        };
      }),
    );

    const filtered = filterType
      ? agents.filter((a) => a.agentType === filterType)
      : agents;

    return filtered.sort((a, b) => b.accuracy - a.accuracy);
  }
}
