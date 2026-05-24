/**
 * Session key management stub.
 *
 * Session keys allow users to sign once and then stream USDC
 * without wallet popup confirmations for each micro-transaction.
 *
 * For hackathon: this is a stub that provides the interface.
 * The full implementation would use EIP-7715 or a similar
 * session key standard with a smart account.
 */

import type { WalletClient, Chain, Transport, Account } from "viem";

/** Session key configuration. */
export interface SessionKeyConfig {
  /** Maximum USDC the session key can spend (6 decimals). */
  maxSpend: bigint;
  /** Session expiry in seconds from creation. */
  expiresIn: number;
  /** Allowed contract addresses the session key can interact with. */
  allowedContracts: `0x${string}`[];
}

/** An active session key with metadata. */
export interface SessionKey {
  /** The session key address (derived from ephemeral keypair). */
  address: `0x${string}`;
  /** Maximum remaining spend. */
  remainingSpend: bigint;
  /** Expiry timestamp (unix seconds). */
  expiresAt: number;
  /** Whether the session is currently valid. */
  isValid: boolean;
}

/**
 * Session key manager.
 *
 * Stub implementation for hackathon. Creates ephemeral keys
 * that would be authorized via smart account in production.
 */
export class SessionKeyManager {
  private activeSession: SessionKey | null = null;

  constructor(
    private readonly walletClient: WalletClient<Transport, Chain, Account>,
  ) {}

  /**
   * Create a new session key.
   *
   * In production, this would:
   * 1. Generate an ephemeral keypair
   * 2. Submit an on-chain authorization tx from the main wallet
   * 3. Return the session key for subsequent use
   *
   * @param config - Session key parameters
   * @returns The created session key
   */
  async createSession(config: SessionKeyConfig): Promise<SessionKey> {
    // Stub: create a mock session
    const session: SessionKey = {
      address: this.walletClient.account.address,
      remainingSpend: config.maxSpend,
      expiresAt: Math.floor(Date.now() / 1000) + config.expiresIn,
      isValid: true,
    };

    this.activeSession = session;
    return session;
  }

  /**
   * Get the current active session, or null if none.
   */
  getSession(): SessionKey | null {
    if (!this.activeSession) return null;

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (now >= this.activeSession.expiresAt) {
      this.activeSession.isValid = false;
    }

    return this.activeSession;
  }

  /**
   * Revoke the current session key.
   *
   * In production, this would submit an on-chain revocation.
   */
  async revokeSession(): Promise<void> {
    if (this.activeSession) {
      this.activeSession.isValid = false;
      this.activeSession = null;
    }
  }
}
