/**
 * Bridge: flow-read.ts
 *
 * Reads FLOW token balance, staked amount, and pending rewards
 * via @flowstream/sdk-options.
 *
 * Input: JSON args via argv[2]
 *   { action: "balance"|"totalSupply"|"totalStaked",
 *     contracts: {...}, rpcUrl: string, address?: string }
 *
 * Output: JSON to stdout
 */

import { FlowStreamClient } from "@flowstream/sdk-options";
import type { ContractAddresses } from "@flowstream/sdk-options";

interface Args {
  action: "balance" | "totalSupply" | "totalStaked";
  contracts: Partial<ContractAddresses>;
  rpcUrl?: string;
  address?: string;
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
    // Mock data when FlowToken contract is not configured
    switch (args.action) {
      case "balance":
        console.log(JSON.stringify({
          balance: 0,
          staked: 0,
          pendingDividends: 0,
        }));
        break;
      case "totalSupply":
        console.log(JSON.stringify({ totalSupply: 0 }));
        break;
      case "totalStaked":
        console.log(JSON.stringify({ totalStaked: 0 }));
        break;
    }
    return;
  }

  const client = new FlowStreamClient({
    contracts,
    rpcUrl: args.rpcUrl,
  });

  switch (args.action) {
    case "balance": {
      if (!args.address) {
        console.error(JSON.stringify({ error: "address is required" }));
        process.exit(1);
      }
      const info = await client.getFlowBalance(args.address as `0x${string}`);
      console.log(JSON.stringify({
        balance: Number(info.balance),
        staked: Number(info.staked),
        pendingDividends: Number(info.pendingDividends),
      }));
      break;
    }
    case "totalSupply": {
      const state = await client.getProtocolState();
      console.log(JSON.stringify({
        totalSupply: Number(state.flowSupply),
      }));
      break;
    }
    case "totalStaked": {
      const state = await client.getProtocolState();
      console.log(JSON.stringify({
        totalStaked: Number(state.flowStaked),
      }));
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
