/**
 * Bridge: vault-write.ts
 *
 * Creates/streams/resolves vaults via @flowstream/sdk-options.
 * Called by the Python CLI via subprocess.
 *
 * Input: JSON args via argv[2]
 *   { action: "create"|"stream"|"resolve"|"finalize"|"withdraw",
 *     contracts: {...}, rpcUrl: string, privateKey: string, ...params }
 *
 * Output: JSON to stdout
 */

import { FlowStreamClient } from "@flowstream/sdk-options";
import type { ContractAddresses, OptionType } from "@flowstream/sdk-options";

interface BaseArgs {
  contracts: Partial<ContractAddresses>;
  rpcUrl?: string;
  privateKey: string;
}

interface CreateArgs extends BaseArgs {
  action: "create";
  option: string;
  optionType: OptionType;
  duration: number;
  stake: number; // raw USDC (6 decimals)
  side: "yes" | "no";
}

interface StreamArgs extends BaseArgs {
  action: "stream";
  vaultId: string;
  side: "yes" | "no";
  amount: number; // raw USDC (6 decimals)
}

interface ResolveArgs extends BaseArgs {
  action: "resolve";
  vaultId: string;
  outcome: "yes" | "no";
  proofCid: string;
}

interface FinalizeArgs extends BaseArgs {
  action: "finalize";
  vaultId: string;
}

interface WithdrawArgs extends BaseArgs {
  action: "withdraw";
  vaultId: string;
}

type Args = CreateArgs | StreamArgs | ResolveArgs | FinalizeArgs | WithdrawArgs;

const args: Args = JSON.parse(process.argv[2] || "{}");

function buildContracts(raw: Partial<any>): ContractAddresses {
  const zero = "0x0000000000000000000000000000000000000000" as `0x${string}`;
  return {
    vault: (raw?.vault ?? zero) as `0x${string}`,
    flowToken: (raw?.flowToken ?? raw?.flow_token ?? zero) as `0x${string}`,
    protocolLP: (raw?.protocolLP ?? raw?.protocol_lp ?? zero) as `0x${string}`,
    agentRegistry: zero,
    observerRegistry: zero,
    steward: zero,
    usdc: (raw?.usdc ?? "0x3600000000000000000000000000000000000000") as `0x${string}`,
  };
}

async function main() {
  const contracts = buildContracts(args.contracts);
  const isConfigured = contracts.vault !== "0x0000000000000000000000000000000000000000";

  // Mock mode: simulate tx hashes when contracts are not deployed
  if (!isConfigured) {
    const { createHash } = await import("node:crypto");
    const mockTxHash = "0x" + createHash("sha256")
      .update(JSON.stringify(args) + Date.now())
      .digest("hex");

    switch (args.action) {
      case "create":
        const mockVaultId = "0x" + createHash("sha256")
          .update((args as CreateArgs).option + Date.now())
          .digest("hex");
        console.log(JSON.stringify({
          vaultId: mockVaultId,
          txHash: mockTxHash,
          _mock: true,
        }));
        break;
      case "stream":
      case "resolve":
      case "finalize":
      case "withdraw":
        console.log(JSON.stringify({
          txHash: mockTxHash,
          _mock: true,
        }));
        break;
      default:
        console.error(JSON.stringify({ error: `Unknown action: ${(args as any).action}` }));
        process.exit(1);
    }
    return;
  }

  // Real SDK path
  const client = new FlowStreamClient({
    contracts,
    rpcUrl: args.rpcUrl,
    wallet: args.privateKey as `0x${string}`,
  });

  switch (args.action) {
    case "create": {
      const a = args as CreateArgs;
      const result = await client.createVault({
        option: a.option,
        optionType: a.optionType,
        duration: a.duration,
        stake: BigInt(a.stake),
        side: a.side,
      });
      console.log(JSON.stringify({
        vaultId: result.vaultId,
        txHash: result.txHash,
      }));
      break;
    }
    case "stream": {
      const a = args as StreamArgs;
      const result = await client.stream({
        vaultId: a.vaultId as `0x${string}`,
        side: a.side,
        amount: BigInt(a.amount),
      });
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    case "resolve": {
      const a = args as ResolveArgs;
      const result = await client.resolve({
        vaultId: a.vaultId as `0x${string}`,
        outcome: a.outcome,
        proofCid: a.proofCid as `0x${string}`,
      });
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    case "finalize": {
      const a = args as FinalizeArgs;
      const result = await client.finalize(a.vaultId as `0x${string}`);
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    case "withdraw": {
      const a = args as WithdrawArgs;
      const result = await client.withdraw(a.vaultId as `0x${string}`);
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    default:
      console.error(JSON.stringify({ error: `Unknown action: ${(args as any).action}` }));
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message ?? String(err) }));
  process.exit(1);
});
