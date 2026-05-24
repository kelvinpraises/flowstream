/**
 * SDK-specific error classes for @flowstream/sdk-options.
 *
 * Follows viem's pattern: typed errors with metadata,
 * not generic Error throws.
 */

export class FlowStreamError extends Error {
  override name = "FlowStreamError";

  details: string;
  shortMessage: string;
  docsPath?: string;

  constructor(
    shortMessage: string,
    args?: {
      cause?: Error;
      details?: string;
      docsPath?: string;
    },
  ) {
    const message = [
      shortMessage,
      args?.details ? `\nDetails: ${args.details}` : "",
      args?.docsPath
        ? `\nDocs: https://flowstream.xyz/docs${args.docsPath}`
        : "",
    ].join("");

    super(message);
    this.details = args?.details ?? "";
    this.shortMessage = shortMessage;
    this.docsPath = args?.docsPath;
    if (args?.cause) this.cause = args.cause;
  }
}

/** Error thrown for vault-related operations. */
export class VaultError extends FlowStreamError {
  override name = "VaultError";
}

/** Error thrown when a wallet is required but not configured. */
export class WalletRequiredError extends FlowStreamError {
  override name = "WalletRequiredError";

  constructor() {
    super("Wallet required for write operations", {
      details:
        "Pass a private key or WalletClient in FlowStreamClientConfig to perform write operations.",
      docsPath: "/sdk-options/configuration",
    });
  }
}

/** Error thrown when a vault is not found. */
export class VaultNotFoundError extends VaultError {
  override name = "VaultNotFoundError";

  constructor(vaultId: string) {
    super(`Vault not found: ${vaultId}`, {
      details: "The vault ID does not correspond to any existing vault on-chain.",
    });
  }
}

/** Error thrown when a contract call fails. */
export class ContractCallError extends FlowStreamError {
  override name = "ContractCallError";

  constructor(method: string, cause?: Error) {
    super(`Contract call failed: ${method}`, {
      cause,
      details: cause?.message,
    });
  }
}
