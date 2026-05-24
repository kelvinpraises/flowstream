/**
 * AgentWallet — simple EOA wallet for autonomous FlowStream agents.
 *
 * Uses viem to sign transactions on Arc testnet. Each agent holds
 * a private key and transacts directly — no external dependencies.
 *
 * For the bookmaker agent lifecycle:
 *   1. Agent starts with a private key (from env)
 *   2. Registers identity via ERC-8004 AgentRegistry
 *   3. Approves USDC spending for the Vault contract
 *   4. Creates vaults, streams USDC, monitors outcomes
 *   5. Reputation updates automatically on vault finalization
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface AgentWalletConfig {
  /** Agent's private key (0x-prefixed hex) */
  privateKey: `0x${string}`;
  /** RPC URL (default: Arc testnet) */
  rpcUrl?: string;
  /** Chain definition */
  chain: Chain;
}

export class AgentWallet {
  readonly account: Account;
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient<Transport, Chain, Account>;

  constructor(config: AgentWalletConfig) {
    const rpcUrl = config.rpcUrl ?? "https://testnet-rpc.arc.network";

    this.account = privateKeyToAccount(config.privateKey);

    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: config.chain,
      transport: http(rpcUrl),
    });
  }

  get address(): `0x${string}` {
    return this.account.address;
  }

  /**
   * Execute a contract write and wait for receipt.
   */
  async execute(params: {
    address: `0x${string}`;
    abi: readonly any[];
    functionName: string;
    args?: readonly any[];
  }): Promise<`0x${string}`> {
    const txHash = await this.walletClient.writeContract({
      ...params,
      account: this.account,
      chain: this.walletClient.chain!,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  /**
   * Read from a contract.
   */
  async read(params: {
    address: `0x${string}`;
    abi: readonly any[];
    functionName: string;
    args?: readonly any[];
  }): Promise<any> {
    return this.publicClient.readContract(params);
  }
}
