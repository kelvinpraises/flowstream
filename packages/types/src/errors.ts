/**
 * FlowStream error hierarchy.
 *
 * Modeled after viem's approach: typed errors with metadata,
 * not generic Error throws. Every SDK extends FlowStreamError
 * for domain-specific errors.
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
    }
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

/** sdk-stats errors */
export class ObserverError extends FlowStreamError {
  override name = "ObserverError";
}

export class AdapterError extends FlowStreamError {
  override name = "AdapterError";
}

/** sdk-options errors */
export class VaultError extends FlowStreamError {
  override name = "VaultError";
}

/** sdk-bookmaker errors */
export class AgentError extends FlowStreamError {
  override name = "AgentError";
}

/** sdk-steward errors */
export class ProposalError extends FlowStreamError {
  override name = "ProposalError";
}
