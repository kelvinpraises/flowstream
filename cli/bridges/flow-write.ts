/**
 * Bridge: flow-write.ts
 *
 * Stake/unstake/claim FLOW tokens via @flowstream/sdk-options.
 * Called by the Python CLI via subprocess.
 *
 * Input: JSON args via argv[2]
 *   { action: "stake"|"unstake"|"claim",
 *     contracts: {...}, rpcUrl: string, privateKey: string, amount?: number }
 *
 * Output: JSON to stdout
 */

import { FlowStreamClient } from "@flowstream/sdk-options";
import type { ContractAddresses } from "@flowstream/sdk-options";

interface Args {
  action: "stake" | "unstake" | "claim";
  contracts: Partial<ContractAddresses>;
  rpcUrl?: string;
  privateKey: string;
  amount?: number; // raw FLOW (18 decimals) as number
}

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
  const isConfigured = contracts.flowToken !== "0x0000000000000000000000000000000000000000";

  if (!isConfigured) {
    // Mock mode
    const { createHash } = await import("node:crypto");
    const mockTxHash = "0x" + createHash("sha256")
      .update(JSON.stringify(args) + Date.now())
      .digest("hex");
    console.log(JSON.stringify({ txHash: mockTxHash, _mock: true }));
    return;
  }

  const client = new FlowStreamClient({
    contracts,
    rpcUrl: args.rpcUrl,
    wallet: args.privateKey as `0x${string}`,
  });

  switch (args.action) {
    case "stake": {
      if (args.amount === undefined) {
        console.error(JSON.stringify({ error: "amount is required for stake" }));
        process.exit(1);
      }
      const result = await client.stakeFlow(BigInt(args.amount));
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    case "unstake": {
      if (args.amount === undefined) {
        console.error(JSON.stringify({ error: "amount is required for unstake" }));
        process.exit(1);
      }
      const result = await client.unstakeFlow(BigInt(args.amount));
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    case "claim": {
      const result = await client.claimDividends();
      console.log(JSON.stringify({ txHash: result.txHash }));
      break;
    }
    default:
      console.error(JSON.stringify({ error: `Unknown action: ${args.action}` }));
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message ?? String(err) }));
  process.exit(1);
});
