/**
 * StewardAgent — main entry point for the steward SDK.
 *
 * Orchestrates monitoring, governance, staking, and the observation feed.
 * Supports both Community and InHouse steward tiers.
 *
 * Usage:
 * ```ts
 * const agent = new StewardAgent({
 *   feedUrl: "ws://localhost:8765",
 *   wallet: "0x...",
 *   contracts: { vault: "0x...", steward: "0x...", ... },
 *   name: "Guardian1",
 * });
 *
 * await agent.register("community");
 * await agent.start();
 * ```
 */

import WebSocket from "ws";
import type { PublicClient, WalletClient, Account } from "viem";
import type {
  StewardTier,
  StewardInfo,
  Proposal,
  ObservationFrame,
  ContractAddresses,
} from "@flowstream/types";
import { ARC_TESTNET } from "@flowstream/types";

import type {
  StewardAgentConfig,
  ProposalResult,
  VaultHealthReport,
} from "./types.js";

import {
  createArcPublicClient,
  createArcWalletClient,
  mapStewardTier,
} from "./utils/index.js";

import { VaultHealthMonitor } from "./monitoring/vault-health.js";
import { ResolutionWatcher } from "./monitoring/resolution-watcher.js";
import { AgentTracker } from "./monitoring/agent-tracker.js";
import { ProposalManager } from "./governance/proposals.js";
import { ChallengeManager } from "./governance/challenges.js";
import { ResolutionManager } from "./governance/resolutions.js";
import { FlowStaking } from "./staking/flow-staking.js";

import { CircleAgentWallet } from "./wallet/agent-wallet.js";
import {
  RegistrationError,
  FeedError,
  MonitoringError,
} from "./errors.js";

/** ABI for Steward registration and reads */
const STEWARD_ABI = [
  {
    name: "registerSteward",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "tier", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "stewards",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "steward", type: "address" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "tier", type: "uint8" },
      { name: "successfulProposals", type: "uint256" },
      { name: "registeredAt", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
  },
  {
    name: "totalStewards",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "stewardList",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "getLeaderboard",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "steward", type: "address" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "successfulProposals", type: "uint256" },
      { name: "tier", type: "uint8" },
    ],
  },
] as const;

/** Default monitoring interval: 30 seconds */
const DEFAULT_CHECK_INTERVAL = 30_000;

/** Map tier string to Solidity enum */
function tierToUint8(tier: StewardTier): number {
  return tier === "community" ? 0 : 1;
}

export class StewardAgent {
  // Config
  private config: Required<
    Pick<StewardAgentConfig, "feedUrl" | "name" | "contracts">
  > &
    StewardAgentConfig;

  // Viem clients
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: Account;

  // Sub-modules
  readonly vaultHealth: VaultHealthMonitor;
  readonly resolutionWatcher: ResolutionWatcher;
  readonly agentTracker: AgentTracker;
  readonly proposals: ProposalManager;
  readonly challenges: ChallengeManager;
  readonly resolutions: ResolutionManager;
  readonly staking: FlowStaking;

  /** Circle Agent Wallet (optional -- gas-free txs when configured) */
  private readonly circleWallet: CircleAgentWallet | null;

  // Runtime state
  private ws: WebSocket | null = null;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: StewardAgentConfig) {
    this.config = config;

    // Initialize viem clients
    this.publicClient = createArcPublicClient(config.rpcUrl);
    const { walletClient, account } = createArcWalletClient(
      config.wallet,
      config.rpcUrl,
    );
    this.walletClient = walletClient;
    this.account = account;

    // Initialize sub-modules
    this.vaultHealth = new VaultHealthMonitor(
      this.publicClient,
      config.contracts,
    );
    this.resolutionWatcher = new ResolutionWatcher(
      this.publicClient,
      config.contracts,
    );
    this.agentTracker = new AgentTracker(
      this.publicClient,
      config.contracts,
    );
    this.proposals = new ProposalManager(
      this.publicClient,
      this.walletClient,
      this.account,
      config.contracts,
    );
    this.challenges = new ChallengeManager(
      this.publicClient,
      this.walletClient,
      this.account,
      config.contracts,
    );
    this.resolutions = new ResolutionManager(
      this.publicClient,
      this.walletClient,
      this.account,
      config.contracts,
    );
    this.staking = new FlowStaking(
      this.publicClient,
      this.walletClient,
      this.account,
      config.contracts,
    );

    // Initialize Circle Agent Wallet if configured
    if (config.circleWallet) {
      this.circleWallet = new CircleAgentWallet(config.circleWallet);
    } else {
      this.circleWallet = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Register as a steward on-chain via the Steward contract.
   *
   * @param tier - "community" (default) or "inHouse" (owner only)
   * @returns Transaction hash
   */
  async register(tier?: StewardTier): Promise<`0x${string}`> {
    const resolvedTier = tier ?? this.config.tier ?? "community";

    try {
      const txHash = await this.walletClient.writeContract({
        address: this.config.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "registerSteward",
        args: [this.config.name, tierToUint8(resolvedTier)],
        account: this.account,
        chain: this.walletClient.chain,
      });

      return txHash;
    } catch (error) {
      throw new RegistrationError("Failed to register as steward", {
        cause: error instanceof Error ? error : undefined,
        details: `name: ${this.config.name}, tier: ${resolvedTier}. May already be registered, or only owner can register in-house.`,
      });
    }
  }

  /**
   * Start the monitoring loop and WebSocket connection.
   *
   * 1. Connect to the observation feed WebSocket
   * 2. Start polling chain state at the configured interval
   * 3. Process incoming frames for resolution detection
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Connect to observation feed
    this.connectFeed();

    // Start the monitoring loop
    const interval = this.config.checkInterval ?? DEFAULT_CHECK_INTERVAL;
    this.monitoringInterval = setInterval(() => {
      this.runMonitoringCycle().catch((err) => {
        console.error("[steward] Monitoring cycle error:", err);
      });
    }, interval);

    // Run the first cycle immediately
    await this.runMonitoringCycle();
  }

  /**
   * Stop the monitoring loop and close WebSocket connection.
   */
  async stop(): Promise<void> {
    this.running = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Governance actions (convenience methods delegating to sub-modules)
  // ---------------------------------------------------------------------------

  /**
   * Propose a vault boost from protocol surplus.
   *
   * @param vaultId - The vault to boost
   * @param amount - Amount of USDC to boost
   * @param flowStake - Amount of $FLOW to stake on this proposal
   */
  async proposeBoost(
    vaultId: `0x${string}`,
    amount: bigint,
    flowStake: bigint,
  ): Promise<ProposalResult> {
    return this.proposals.proposeBoost(vaultId, amount, flowStake);
  }

  /**
   * Propose a slash against a bad actor agent.
   *
   * @param agent - Address of the agent to slash
   * @param evidence - Encoded evidence (IPFS CID or data)
   * @param flowStake - Amount of $FLOW to stake
   */
  async proposeSlash(
    agent: `0x${string}`,
    evidence: `0x${string}`,
    flowStake: bigint,
  ): Promise<ProposalResult> {
    return this.proposals.proposeSlash(agent, evidence, flowStake);
  }

  /**
   * Challenge a governance proposal.
   *
   * @param proposalId - The proposal to challenge
   * @param flowStake - Amount of $FLOW to stake against the proposal
   */
  async challengeProposal(
    proposalId: number,
    flowStake: bigint,
  ): Promise<`0x${string}`> {
    return this.challenges.challengeProposal(proposalId, flowStake);
  }

  /**
   * Execute an unchallenged proposal after the challenge window.
   */
  async executeProposal(proposalId: number): Promise<`0x${string}`> {
    return this.proposals.executeProposal(proposalId);
  }

  /**
   * Veto a proposal (InHouse stewards only, max 5/month).
   */
  async vetoProposal(proposalId: number): Promise<`0x${string}`> {
    return this.challenges.vetoProposal(proposalId);
  }

  // ---------------------------------------------------------------------------
  // Resolution (convenience methods)
  // ---------------------------------------------------------------------------

  /**
   * Submit a resolution for a vault.
   *
   * @param vaultId - The vault to resolve
   * @param outcome - "yes" or "no"
   * @param proofCid - IPFS CID of the proof (bytes32)
   */
  async submitResolution(
    vaultId: `0x${string}`,
    outcome: "yes" | "no",
    proofCid: `0x${string}`,
  ): Promise<`0x${string}`> {
    return this.resolutions.submitResolution(vaultId, outcome, proofCid);
  }

  /**
   * Finalize a resolution after the challenge window passes.
   */
  async confirmResolution(vaultId: `0x${string}`): Promise<`0x${string}`> {
    return this.resolutions.confirmResolution(vaultId);
  }

  /**
   * Challenge a vault resolution with a counter-proof.
   */
  async challengeResolution(
    vaultId: `0x${string}`,
    proofCid: `0x${string}`,
  ): Promise<`0x${string}`> {
    return this.challenges.challengeResolution(vaultId, proofCid);
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  /**
   * Get vault health reports for all vaults with issues.
   */
  async getVaultHealth(): Promise<VaultHealthReport[]> {
    return this.vaultHealth.scanAll();
  }

  /**
   * Get the steward leaderboard.
   */
  async getLeaderboard(): Promise<StewardInfo[]> {
    try {
      const totalStewards = (await this.publicClient.readContract({
        address: this.config.contracts.steward,
        abi: STEWARD_ABI,
        functionName: "totalStewards",
      })) as bigint;

      const stewards: StewardInfo[] = [];
      const count = Number(totalStewards);

      for (let i = 0; i < count; i++) {
        const address = (await this.publicClient.readContract({
          address: this.config.contracts.steward,
          abi: STEWARD_ABI,
          functionName: "stewardList",
          args: [BigInt(i)],
        })) as `0x${string}`;

        const [name, successfulProposals, tier] =
          (await this.publicClient.readContract({
            address: this.config.contracts.steward,
            abi: STEWARD_ABI,
            functionName: "getLeaderboard",
            args: [address],
          })) as [string, bigint, number];

        stewards.push({
          address,
          name,
          tier: mapStewardTier(tier),
          successfulProposals: Number(successfulProposals),
          registeredAt: 0, // Not returned by getLeaderboard; would need separate call
        });
      }

      // Sort by successful proposals descending
      stewards.sort((a, b) => b.successfulProposals - a.successfulProposals);

      return stewards;
    } catch (error) {
      throw new MonitoringError("Failed to fetch leaderboard", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Get all pending governance proposals.
   */
  async getPendingProposals(): Promise<Proposal[]> {
    return this.proposals.getPendingProposals();
  }

  /**
   * Get this steward's address.
   */
  get address(): `0x${string}` {
    return this.account.address;
  }

  /**
   * Check if the monitoring loop is running.
   */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Whether Circle Agent Wallet is configured.
   */
  get hasCircleWallet(): boolean {
    return this.circleWallet !== null;
  }

  /**
   * Initialize the Circle Agent Wallet (if configured).
   *
   * Verifies the CLI session is active and discovers the wallet address.
   * Call this before start() if you want gas-free governance transactions.
   */
  async initCircleWallet(): Promise<void> {
    if (!this.circleWallet) {
      throw new Error("Circle Agent Wallet not configured");
    }
    await this.circleWallet.init();
  }

  /**
   * Get the Circle Agent Wallet instance for direct operations.
   */
  getCircleWallet(): CircleAgentWallet | null {
    return this.circleWallet;
  }

  // ---------------------------------------------------------------------------
  // Internal: WebSocket feed connection
  // ---------------------------------------------------------------------------

  private connectFeed(): void {
    try {
      this.ws = new WebSocket(this.config.feedUrl);

      this.ws.on("open", () => {
        console.log(
          `[steward:${this.config.name}] Connected to feed: ${this.config.feedUrl}`,
        );
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const frame: ObservationFrame = JSON.parse(data.toString());
          this.resolutionWatcher.addFrame(frame);
        } catch {
          // Skip malformed frames
        }
      });

      this.ws.on("close", () => {
        console.log(`[steward:${this.config.name}] Feed disconnected`);
        // Reconnect after a delay if still running
        if (this.running) {
          setTimeout(() => this.connectFeed(), 5000);
        }
      });

      this.ws.on("error", (err: Error) => {
        console.error(`[steward:${this.config.name}] Feed error:`, err.message);
      });
    } catch (error) {
      console.error(
        `[steward:${this.config.name}] Failed to connect to feed:`,
        error,
      );
      // Retry after a delay if still running
      if (this.running) {
        setTimeout(() => this.connectFeed(), 5000);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Internal: monitoring cycle
  // ---------------------------------------------------------------------------

  /**
   * Run one cycle of the monitoring loop.
   *
   * Checks:
   * 1. Pending resolutions — verify against own observations
   * 2. Vaults ready for finalization — auto-finalize
   * 3. Vault health — flag issues
   * 4. Agent behavior — track record assessment
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      // 1. Check pending resolutions
      const pendingResolutions =
        await this.resolutionWatcher.getPendingResolutions();
      for (const resolution of pendingResolutions) {
        if (resolution.observationMatch === false && this.config.autoChallenge) {
          // Our observations conflict with the submitted resolution
          console.log(
            `[steward:${this.config.name}] Resolution mismatch detected for vault ${resolution.vaultId}`,
          );
          // In auto-challenge mode, we would submit a challenge here
          // For now, just log the discrepancy
        }
      }

      // 2. Check for vaults ready for finalization
      const finalizableVaults =
        await this.vaultHealth.getFinalizableVaults();
      for (const report of finalizableVaults) {
        try {
          const isReady = await this.resolutions.isReadyToFinalize(
            report.vaultId,
          );
          if (isReady) {
            console.log(
              `[steward:${this.config.name}] Finalizing vault ${report.vaultId}`,
            );
            await this.confirmResolution(report.vaultId);
          }
        } catch {
          // Non-fatal — will retry next cycle
        }
      }

      // 3. Check vault health for issues
      const healthReports = await this.vaultHealth.scanAll();
      for (const report of healthReports) {
        if (report.flags.includes("disputed")) {
          console.log(
            `[steward:${this.config.name}] Disputed vault: ${report.vaultId}`,
          );
        }
        if (report.flags.includes("asymmetric_pool")) {
          console.log(
            `[steward:${this.config.name}] Asymmetric pool: ${report.vaultId} (ratio: ${report.poolRatio.toFixed(2)})`,
          );
        }
      }
    } catch (error) {
      // Log but don't throw — monitoring should be resilient
      console.error(
        `[steward:${this.config.name}] Monitoring cycle error:`,
        error,
      );
    }
  }
}
