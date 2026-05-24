/**
 * BookmakerAgent — the main entry point for the bookmaker SDK.
 *
 * Autonomous agent that:
 *   1. Connects to an observation feed (WebSocket)
 *   2. Buffers recent ObservationFrames
 *   3. Runs pattern detectors on a regular interval
 *   4. Creates vaults on-chain when confidence exceeds threshold
 *   5. Stakes its own USDC on the detected side
 *
 * Content-agnostic: works with any observation feed regardless of
 * the underlying content type (football, esports, debates, etc.).
 */

import type { ObservationFrame, AgentReputation } from "@flowstream/types";
import { MAX_FLOATING_BETS } from "@flowstream/types";
import type {
  BookmakerAgentConfig,
  BookmakerAgentEvents,
  PatternDetector,
  DetectionResult,
} from "./types.js";
import { AgentLifecycleError } from "./errors.js";
import { ObservationConsumer } from "./feed/observation-consumer.js";
import { VaultCreator } from "./vault/vault-creator.js";
import { PositionManager } from "./vault/position-manager.js";
import { AgentIdentityRegistry } from "./identity/registry.js";
import { CircleAgentWallet } from "./wallet/agent-wallet.js";
import { createDefaultDetectors } from "./patterns/index.js";

// ---------------------------------------------------------------------------
// Default configuration values
// ---------------------------------------------------------------------------

const DEFAULT_CHECK_INTERVAL = 10_000; // 10 seconds
const DEFAULT_STAKE = 10_000_000n; // 10 USDC
const DEFAULT_BUFFER_MINUTES = 5;
const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// BookmakerAgent
// ---------------------------------------------------------------------------

export class BookmakerAgent {
  // --- Configuration ---
  private readonly feedUrl: string;
  private readonly checkInterval: number;
  private readonly defaultStake: bigint;
  private readonly confidenceThreshold: number;
  private readonly agentName: string;
  private readonly detectors: PatternDetector[];
  private readonly bufferMinutes: number;

  // --- Internal modules ---
  private readonly consumer: ObservationConsumer;
  private readonly vaultCreator: VaultCreator;
  private readonly positionManager: PositionManager;
  private readonly identityRegistry: AgentIdentityRegistry;

  /** Circle Agent Wallet (optional -- gas-free txs when configured) */
  private readonly circleWallet: CircleAgentWallet | null;

  // --- State ---
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private _running = false;

  // --- Event callbacks ---
  private events: BookmakerAgentEvents = {};

  constructor(config: BookmakerAgentConfig) {
    this.feedUrl = config.feedUrl;
    this.checkInterval = config.checkInterval ?? DEFAULT_CHECK_INTERVAL;
    this.defaultStake = config.defaultStake ?? DEFAULT_STAKE;
    this.confidenceThreshold =
      config.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
    this.agentName = config.name;
    this.detectors = config.detectors ?? createDefaultDetectors();
    this.bufferMinutes = config.bufferMinutes ?? DEFAULT_BUFFER_MINUTES;

    // Max buffer size: bufferMinutes * 60s * 5fps
    const maxBuffer = this.bufferMinutes * 60 * 5;

    this.consumer = new ObservationConsumer({
      url: config.feedUrl,
      maxBufferSize: maxBuffer,
    });

    this.vaultCreator = new VaultCreator(
      config.wallet,
      config.contracts,
      config.rpcUrl,
    );

    this.positionManager = new PositionManager(
      config.wallet,
      config.contracts,
      config.rpcUrl,
    );

    this.identityRegistry = new AgentIdentityRegistry(
      config.wallet,
      config.contracts,
      config.rpcUrl,
    );

    // Initialize Circle Agent Wallet if configured
    if (config.circleWallet) {
      this.circleWallet = new CircleAgentWallet(config.circleWallet);
    } else {
      this.circleWallet = null;
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Start the agent: connect to feed and begin detection loop.
   *
   * @throws {AgentLifecycleError} If already running.
   * @throws {FeedConnectionError} If the feed cannot be reached.
   */
  async start(): Promise<void> {
    if (this._running) {
      throw new AgentLifecycleError("Agent is already running");
    }

    // Wire up frame callback
    this.consumer.onFrame((frame) => {
      this.events.onFrame?.(frame);
    });

    this.consumer.onError((err) => {
      this.events.onError?.(err);
    });

    // Connect to observation feed
    await this.consumer.connect();

    // Start periodic pattern checking
    this._running = true;
    this.checkTimer = setInterval(() => {
      this.checkPatterns().catch((err) => {
        this.events.onError?.(
          err instanceof Error ? err : new Error(String(err)),
        );
      });
    }, this.checkInterval);
  }

  /**
   * Stop the agent gracefully.
   */
  async stop(): Promise<void> {
    this._running = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    this.consumer.disconnect();
  }

  /**
   * Register the agent's ERC-8004 identity on-chain.
   *
   * @returns Transaction hash of the registration.
   */
  async register(): Promise<`0x${string}`> {
    return this.identityRegistry.register(this.agentName);
  }

  /**
   * Initialize the Circle Agent Wallet (if configured).
   *
   * Call this after constructing the agent if you provided circleWallet
   * config. It verifies the CLI session is active and discovers the
   * wallet address.
   *
   * @throws If Circle CLI is not installed or session is not active.
   */
  async initCircleWallet(): Promise<void> {
    if (!this.circleWallet) {
      throw new Error("Circle Agent Wallet not configured");
    }
    await this.circleWallet.init();
  }

  /**
   * Get the Circle Agent Wallet instance for direct operations.
   *
   * @returns The CircleAgentWallet, or null if not configured.
   */
  getCircleWallet(): CircleAgentWallet | null {
    return this.circleWallet;
  }

  /** Whether Circle Agent Wallet is configured */
  get hasCircleWallet(): boolean {
    return this.circleWallet !== null;
  }

  /**
   * Manually trigger a pattern check against the current buffer.
   *
   * Useful for testing: fill the buffer, then call checkPatterns()
   * to see what detections fire without waiting for the interval.
   */
  async checkPatterns(): Promise<void> {
    const buf = this.consumer.buffer;
    if (buf.length === 0) return;

    // Respect max floating bets
    if (this.positionManager.positionCount >= MAX_FLOATING_BETS) return;

    for (const detector of this.detectors) {
      try {
        const result = detector.detect(buf);
        if (!result) continue;
        if (result.confidence < this.confidenceThreshold) continue;

        // Notify detection listeners
        this.events.onDetection?.(result);

        // Create vault on-chain
        const { vaultId, txHash } = await this.vaultCreator.createVault({
          option: result.option,
          optionType: result.optionType,
          duration: result.duration,
          stake: result.stake > 0n ? result.stake : this.defaultStake,
          side: result.side,
        });

        // Track the position locally
        this.positionManager.trackPosition(
          vaultId,
          result.side,
          result.stake > 0n ? result.stake : this.defaultStake,
        );

        // Notify vault creation listeners
        this.events.onVaultCreated?.(vaultId, result);

        // Only create one vault per check cycle to avoid spam
        break;
      } catch (err) {
        this.events.onError?.(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    }
  }

  /**
   * Get the current observation buffer (oldest first).
   */
  get buffer(): ObservationFrame[] {
    return this.consumer.buffer;
  }

  /**
   * Whether the agent is currently running.
   */
  get running(): boolean {
    return this._running;
  }

  /**
   * The agent's wallet address.
   */
  get address(): `0x${string}` {
    return this.vaultCreator.address;
  }

  /**
   * Get the agent's on-chain reputation.
   */
  async getReputation(): Promise<AgentReputation> {
    return this.identityRegistry.getReputation();
  }

  /**
   * Get the position manager for direct position operations.
   */
  get positions(): PositionManager {
    return this.positionManager;
  }

  // -----------------------------------------------------------------------
  // Event registration
  // -----------------------------------------------------------------------

  /** Register a callback for each incoming observation frame */
  onFrame(cb: NonNullable<BookmakerAgentEvents["onFrame"]>): this {
    this.events.onFrame = cb;
    return this;
  }

  /** Register a callback for pattern detections */
  onDetection(cb: NonNullable<BookmakerAgentEvents["onDetection"]>): this {
    this.events.onDetection = cb;
    return this;
  }

  /** Register a callback for vault creation */
  onVaultCreated(cb: NonNullable<BookmakerAgentEvents["onVaultCreated"]>): this {
    this.events.onVaultCreated = cb;
    return this;
  }

  /** Register a callback for errors */
  onError(cb: NonNullable<BookmakerAgentEvents["onError"]>): this {
    this.events.onError = cb;
    return this;
  }
}
