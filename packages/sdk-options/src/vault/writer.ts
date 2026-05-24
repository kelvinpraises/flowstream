/**
 * Vault writer — create vaults, stream USDC, resolve, finalize, withdraw.
 *
 * All methods require a wallet (WalletClient) for signing transactions.
 * Handles USDC approval before vault operations automatically.
 *
 * Ported from chain.py ChainClient write methods.
 */

import type { PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import type { OptionType } from "@flowstream/types";
import { VAULT_ABI, ERC20_ABI } from "../abi.js";
import { VaultError, ContractCallError } from "../errors.js";
import type { CreateVaultParams, StreamParams, ResolveParams, TxResult, CreateVaultResult } from "../types.js";

// Option type to uint8 mapping (matches Vault.sol enum order)
const OPTION_TYPE_TO_UINT8: Record<OptionType, number> = {
  momentum: 0,
  performance: 1,
  threshold: 2,
  timing: 3,
  swing: 4,
};

/**
 * Write operations on the Vault contract.
 */
export class VaultWriter {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly walletClient: WalletClient<Transport, Chain, Account>,
    private readonly vaultAddress: `0x${string}`,
    private readonly usdcAddress: `0x${string}`,
  ) {}

  /**
   * Create a new prediction vault.
   *
   * Approves USDC spending before creating the vault.
   *
   * @param params - Vault creation parameters
   * @returns Vault ID and transaction hash
   */
  async createVault(params: CreateVaultParams): Promise<CreateVaultResult> {
    const { option, optionType, duration, stake, side } = params;

    const optionTypeUint8 = OPTION_TYPE_TO_UINT8[optionType];
    if (optionTypeUint8 === undefined) {
      throw new VaultError(`Invalid option type: ${optionType}`);
    }

    const creatorSide = side === "yes";

    // Approve USDC first
    await this.approveUSDC(stake);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "createVault",
        args: [option, optionTypeUint8, BigInt(duration), stake, creatorSide],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      // Extract vault ID from receipt logs (VaultCreated event)
      // For hackathon simplicity, derive from tx hash
      const vaultId = (receipt.logs[0]?.topics[1] ?? txHash) as `0x${string}`;

      return { vaultId, txHash };
    } catch (err) {
      throw new ContractCallError("createVault", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Stream USDC into a vault side.
   *
   * Approves USDC spending before streaming.
   *
   * @param params - Stream parameters (vaultId, side, amount)
   * @returns Transaction hash
   */
  async stream(params: StreamParams): Promise<TxResult> {
    const { vaultId, side, amount } = params;
    const yesSide = side === "yes";

    // Approve USDC first
    await this.approveUSDC(amount);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "stream",
        args: [vaultId, yesSide, amount],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("stream", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Submit a vault resolution.
   *
   * @param params - Resolution parameters (vaultId, outcome, proofCid)
   * @returns Transaction hash
   */
  async resolve(params: ResolveParams): Promise<TxResult> {
    const { vaultId, outcome, proofCid } = params;
    // outcome: 1=yes, 2=no (matches Vault.sol Outcome enum)
    const outcomeUint8 = outcome === "yes" ? 1 : 2;

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "resolve",
        args: [vaultId, outcomeUint8, proofCid],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("resolve", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Finalize a resolved vault after the challenge window has passed.
   *
   * @param vaultId - Vault to finalize
   * @returns Transaction hash
   */
  async finalize(vaultId: `0x${string}`): Promise<TxResult> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "finalize",
        args: [vaultId],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("finalize", err instanceof Error ? err : undefined);
    }
  }

  /**
   * Withdraw winnings from a resolved vault.
   * Winners receive USDC. Losers receive FLOW tokens (minted on-chain).
   *
   * @param vaultId - Vault to withdraw from
   * @returns Transaction hash
   */
  async withdraw(vaultId: `0x${string}`): Promise<TxResult> {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [vaultId],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      return { txHash };
    } catch (err) {
      throw new ContractCallError("withdraw", err instanceof Error ? err : undefined);
    }
  }

  // -- Internal --

  /**
   * Approve USDC spending for the Vault contract.
   * Checks current allowance first, only approves if needed.
   */
  private async approveUSDC(amount: bigint): Promise<void> {
    const currentAllowance = await this.publicClient.readContract({
      address: this.usdcAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [this.walletClient.account.address, this.vaultAddress],
    });

    if (currentAllowance >= amount) {
      return; // Already approved
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [this.vaultAddress, amount],
        account: this.walletClient.account,
      });

      const txHash = await this.walletClient.writeContract(request);
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    } catch (err) {
      throw new ContractCallError("approve USDC", err instanceof Error ? err : undefined);
    }
  }
}
