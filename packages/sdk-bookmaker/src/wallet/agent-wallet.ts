/**
 * CircleAgentWallet — programmatic wallet for autonomous FlowStream agents.
 *
 * Uses @circle-fin/developer-controlled-wallets to create and manage
 * MPC-secured wallets server-side. No CLI, no browser, no passkeys.
 *
 * Setup (one-time in Circle Console):
 *   1. Get API key from console.circle.com (Web3 Services)
 *   2. Generate entity secret (32 bytes) and register its ciphertext
 *   3. Pass both to CircleAgentWallet constructor
 *
 * How it works:
 *   - Circle holds one MPC key shard, entity secret secures the other
 *   - Wallets are created programmatically via SDK (up to 200 per call)
 *   - Transactions are signed server-side through Circle's infrastructure
 *   - Gas can be sponsored via Gas Station (gasless for agents)
 *   - Wallets auto-provision on all supported chains on creation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CircleAgentWalletConfig {
  /** Circle API key from Console (Web3 Services) */
  apiKey: string;
  /** 32-byte entity secret (hex string) — secures MPC key shard */
  entitySecret: string;
  /** Blockchain identifier (default: "ARC-TESTNET") */
  blockchain?: string;
  /** Existing wallet ID (skip creation if provided) */
  walletId?: string;
}

export interface CircleWalletInfo {
  id: string;
  address: string;
  blockchain: string;
  accountType: string;
  state: string;
}

export interface CircleTxResult {
  id: string;
  state: string;
  txHash?: string;
}

// ---------------------------------------------------------------------------
// CircleAgentWallet
// ---------------------------------------------------------------------------

export class CircleAgentWallet {
  private client: any = null;
  private readonly config: CircleAgentWalletConfig;
  private readonly blockchain: string;
  private _walletId: string | null;
  private _address: `0x${string}` | null = null;

  constructor(config: CircleAgentWalletConfig) {
    this.config = config;
    this.blockchain = config.blockchain ?? "ARC-TESTNET";
    this._walletId = config.walletId ?? null;
  }

  get address(): `0x${string}` {
    if (!this._address) {
      throw new Error("Wallet not initialized. Call init() first.");
    }
    return this._address;
  }

  get walletId(): string {
    if (!this._walletId) {
      throw new Error("Wallet not initialized. Call init() first.");
    }
    return this._walletId;
  }

  /**
   * Initialize: connect to Circle SDK and create or load wallet.
   */
  async init(): Promise<void> {
    const mod = await import("@circle-fin/developer-controlled-wallets");
    this.client = mod.initiateDeveloperControlledWalletsClient({
      apiKey: this.config.apiKey,
      entitySecret: this.config.entitySecret,
    });

    if (this._walletId) {
      // Load existing wallet
      const resp = await this.client.getWallet({ id: this._walletId });
      this._address = resp.data.wallet.address as `0x${string}`;
    } else {
      // Create new wallet set + wallet
      const walletSet = await this.client.createWalletSet({
        name: `FlowStream Agent ${Date.now()}`,
      });

      const wallets = await this.client.createWallets({
        walletSetId: walletSet.data.walletSet.id,
        blockchains: [this.blockchain],
        count: 1,
        accountType: "SCA", // Smart Contract Account for gasless
      });

      const wallet = wallets.data.wallets[0];
      this._walletId = wallet.id;
      this._address = wallet.address as `0x${string}`;
    }
  }

  /**
   * Execute a smart contract function (gas-sponsored by Circle).
   */
  async executeContract(
    contractAddress: `0x${string}`,
    abiFunctionSignature: string,
    abiParameters: string[],
  ): Promise<CircleTxResult> {
    this.requireInit();

    const resp = await this.client.createContractExecutionTransaction({
      walletId: this._walletId,
      contractAddress,
      abiFunctionSignature,
      abiParameters,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });

    return {
      id: resp.data.transaction.id,
      state: resp.data.transaction.state,
      txHash: resp.data.transaction.txHash,
    };
  }

  /**
   * Transfer USDC to another address.
   */
  async transfer(
    toAddress: `0x${string}`,
    amount: string,
    tokenAddress?: `0x${string}`,
  ): Promise<CircleTxResult> {
    this.requireInit();

    const resp = await this.client.createTransferTransaction({
      walletId: this._walletId,
      destinationAddress: toAddress,
      amounts: [amount],
      tokenAddress,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });

    return {
      id: resp.data.transaction.id,
      state: resp.data.transaction.state,
      txHash: resp.data.transaction.txHash,
    };
  }

  /**
   * Get wallet balances.
   */
  async getBalances(): Promise<{ token: string; amount: string }[]> {
    this.requireInit();

    const resp = await this.client.listWalletBallance({
      id: this._walletId,
    });

    return resp.data.tokenBalances ?? [];
  }

  // ─── FlowStream convenience methods ───

  /** Approve USDC spending for a contract */
  async approveUSDC(
    spender: `0x${string}`,
    amount: bigint,
    usdcAddress: `0x${string}`,
  ): Promise<CircleTxResult> {
    return this.executeContract(
      usdcAddress,
      "approve(address,uint256)",
      [spender, amount.toString()],
    );
  }

  /** Create a vault via the agent wallet */
  async createVault(
    vaultContract: `0x${string}`,
    option: string,
    optionType: number,
    duration: bigint,
    stake: bigint,
    creatorSide: boolean,
  ): Promise<CircleTxResult> {
    return this.executeContract(
      vaultContract,
      "createVault(string,uint8,uint256,uint256,bool)",
      [option, optionType.toString(), duration.toString(), stake.toString(), creatorSide.toString()],
    );
  }

  /** Stream USDC into a vault side */
  async streamToVault(
    vaultContract: `0x${string}`,
    vaultId: `0x${string}`,
    yesSide: boolean,
    amount: bigint,
  ): Promise<CircleTxResult> {
    return this.executeContract(
      vaultContract,
      "stream(bytes32,bool,uint256)",
      [vaultId, yesSide.toString(), amount.toString()],
    );
  }

  /** Register agent identity via ERC-8004 */
  async registerAgent(
    registryAddress: `0x${string}`,
    name: string,
    agentType: number,
  ): Promise<CircleTxResult> {
    return this.executeContract(
      registryAddress,
      "registerAgent(string,uint8)",
      [name, agentType.toString()],
    );
  }

  // ─── Internal ───

  private requireInit(): void {
    if (!this.client || !this._walletId) {
      throw new Error("Wallet not initialized. Call init() first.");
    }
  }
}
