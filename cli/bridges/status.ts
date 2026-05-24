/**
 * Bridge: status.ts
 *
 * Reads protocol state via @flowstream/sdk-options.
 * Returns LP total, vault stats, FLOW supply, and optionally wallet balances.
 *
 * Input: JSON args via argv[2]
 *   { contracts: {...}, rpcUrl: string, walletAddress?: string }
 *
 * Output: JSON to stdout
 */

import { FlowStreamClient } from "@flowstream/sdk-options";
import type { ContractAddresses } from "@flowstream/sdk-options";

interface Args {
  contracts: Partial<ContractAddresses>;
  rpcUrl?: string;
  walletAddress?: string;
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
  const hasContracts = [contracts.vault, contracts.flowToken, contracts.protocolLP]
    .some(addr => addr !== "0x0000000000000000000000000000000000000000");

  if (!hasContracts) {
    // Mock mode — return sensible defaults
    const result: any = {
      protocol: {
        lpTotal: 0,
        surplus: 0,
        flowSupply: 0,
        flowStaked: 0,
      },
      vaults: {
        total: 3,
        active: 2,
        totalYes: 450_000_000,
        totalNo: 380_000_000,
      },
      wallet: null,
      _mock: true,
    };

    if (args.walletAddress) {
      result.wallet = {
        address: args.walletAddress,
        usdcBalance: 1000_000_000,
        flowBalance: 0,
        flowStaked: 0,
        pendingDividends: 0,
      };
    }

    console.log(JSON.stringify(result));
    return;
  }

  // Real SDK path
  const client = new FlowStreamClient({
    contracts,
    rpcUrl: args.rpcUrl,
  });

  // Fetch protocol state and vault list in parallel
  const [protocolState, vaults] = await Promise.all([
    client.getProtocolState().catch(() => ({
      lpTotal: 0n,
      surplus: 0n,
      flowSupply: 0n,
      flowStaked: 0n,
    })),
    client.listVaults({ limit: 50 }).catch(() => []),
  ]);

  const totalVaults = vaults.length;
  const activeVaults = vaults.filter(
    (v: any) => v.status === "open" || v.status === "hot"
  ).length;
  const totalYes = vaults.reduce(
    (sum: number, v: any) => sum + Number(v.yesTotal ?? 0n), 0
  );
  const totalNo = vaults.reduce(
    (sum: number, v: any) => sum + Number(v.noTotal ?? 0n), 0
  );

  const result: any = {
    protocol: {
      lpTotal: Number(protocolState.lpTotal),
      surplus: Number(protocolState.surplus),
      flowSupply: Number(protocolState.flowSupply),
      flowStaked: Number(protocolState.flowStaked),
    },
    vaults: {
      total: totalVaults,
      active: activeVaults,
      totalYes,
      totalNo,
    },
    wallet: null,
  };

  // Wallet info if address provided
  if (args.walletAddress) {
    try {
      const flowInfo = await client.getFlowBalance(
        args.walletAddress as `0x${string}`
      );
      result.wallet = {
        address: args.walletAddress,
        usdcBalance: 0, // Would need separate USDC balance read
        flowBalance: Number(flowInfo.balance),
        flowStaked: Number(flowInfo.staked),
        pendingDividends: Number(flowInfo.pendingDividends),
      };
    } catch {
      result.wallet = {
        address: args.walletAddress,
        usdcBalance: 0,
        flowBalance: 0,
        flowStaked: 0,
        pendingDividends: 0,
      };
    }
  }

  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message ?? String(err) }));
  process.exit(1);
});
