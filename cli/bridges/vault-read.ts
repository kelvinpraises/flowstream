/**
 * Bridge: vault-read.ts
 *
 * Reads vault state via @flowstream/sdk-options.
 * Called by the Python CLI via subprocess.
 *
 * Input: JSON args via argv[2]
 *   { action: "list" | "info", contracts: {...}, rpcUrl: string, vaultId?: string, filters?: {...} }
 *
 * Output: JSON to stdout
 */

import { FlowStreamClient, formatUSDC } from "@flowstream/sdk-options";
import type { ContractAddresses, VaultStatus } from "@flowstream/sdk-options";

interface Args {
  action: "list" | "info" | "position";
  contracts: Partial<ContractAddresses>;
  rpcUrl?: string;
  vaultId?: string;
  userAddress?: string;
  filters?: {
    status?: VaultStatus;
    limit?: number;
  };
}

const args: Args = JSON.parse(process.argv[2] || "{}");

/**
 * Build a FlowStreamClient config from bridge args.
 * Uses mock-safe defaults when contracts are not configured.
 */
function buildConfig(args: Args) {
  const contracts = {
    vault: (args.contracts?.vault ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    flowToken: (args.contracts?.flowToken ?? args.contracts?.flow_token ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    protocolLP: (args.contracts?.protocolLP ?? args.contracts?.protocol_lp ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    agentRegistry: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    observerRegistry: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    steward: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    usdc: (args.contracts?.usdc ?? "0x3600000000000000000000000000000000000000") as `0x${string}`,
  };

  return {
    contracts,
    rpcUrl: args.rpcUrl,
  };
}

async function main() {
  const config = buildConfig(args);

  // If no vault contract is configured, return mock data
  const isConfigured = config.contracts.vault !== "0x0000000000000000000000000000000000000000";

  if (!isConfigured) {
    // Return mock data matching the CLI's existing mock format
    switch (args.action) {
      case "list": {
        const limit = args.filters?.limit ?? 20;
        const mockVaults = generateMockVaults(Math.min(limit, 5));
        if (args.filters?.status) {
          const filtered = mockVaults.filter((v: any) => v.status === args.filters!.status);
          console.log(JSON.stringify(filtered));
        } else {
          console.log(JSON.stringify(mockVaults));
        }
        break;
      }
      case "info": {
        if (!args.vaultId) {
          console.error(JSON.stringify({ error: "vaultId is required for info action" }));
          process.exit(1);
        }
        console.log(JSON.stringify(generateMockVault(args.vaultId)));
        break;
      }
      case "position": {
        console.log(JSON.stringify({
          yesShares: "0",
          noShares: "0",
          yesDeposited: 0,
          noDeposited: 0,
          withdrawn: false,
        }));
        break;
      }
      default:
        console.error(JSON.stringify({ error: `Unknown action: ${args.action}` }));
        process.exit(1);
    }
    return;
  }

  // Real SDK path — contracts are configured
  const client = new FlowStreamClient(config);

  switch (args.action) {
    case "list": {
      const vaults = await client.listVaults(args.filters);
      // Serialize bigints as strings for JSON
      const serialized = vaults.map(serializeVault);
      console.log(JSON.stringify(serialized));
      break;
    }
    case "info": {
      if (!args.vaultId) {
        console.error(JSON.stringify({ error: "vaultId is required" }));
        process.exit(1);
      }
      const vault = await client.getVault(args.vaultId as `0x${string}`);
      console.log(JSON.stringify(serializeVault(vault)));
      break;
    }
    case "position": {
      if (!args.vaultId || !args.userAddress) {
        console.error(JSON.stringify({ error: "vaultId and userAddress are required" }));
        process.exit(1);
      }
      const pos = await client.getPosition(
        args.vaultId as `0x${string}`,
        args.userAddress as `0x${string}`,
      );
      console.log(JSON.stringify({
        yesShares: pos.yesShares.toString(),
        noShares: pos.noShares.toString(),
        yesDeposited: Number(pos.yesDeposited),
        noDeposited: Number(pos.noDeposited),
        withdrawn: pos.withdrawn,
      }));
      break;
    }
    default:
      console.error(JSON.stringify({ error: `Unknown action: ${args.action}` }));
      process.exit(1);
  }
}

// --- Serialization helpers ---

function serializeVault(v: any): any {
  return {
    id: v.id,
    option: v.option,
    optionType: v.optionType,
    creator: v.creator ?? "0x" + "00".repeat(20),
    yesTotal: typeof v.yesTotal === "bigint" ? Number(v.yesTotal) : (v.yesTotal ?? 0),
    noTotal: typeof v.noTotal === "bigint" ? Number(v.noTotal) : (v.noTotal ?? 0),
    status: v.status,
    hotUntil: v.hotUntil ?? 0,
    createdAt: v.createdAt ?? 0,
    expiresAt: v.expiresAt ?? 0,
    outcome: v.outcome ?? "pending",
  };
}

// --- Mock data generators ---

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

function generateMockVault(vaultId: string): any {
  const rng = seededRandom(vaultId);
  const options = [
    "Next goal before 70'",
    "Home team scores next",
    "3+ corners in first half",
    "Yellow card in next 10 min",
  ];
  const types = ["momentum", "player", "threshold", "timing", "swing"];
  const statuses = ["open", "hot", "resolved"];
  const now = Math.floor(Date.now() / 1000);

  return {
    id: vaultId,
    option: options[Math.floor(rng() * options.length)],
    optionType: types[Math.floor(rng() * types.length)],
    creator: "0x" + "ab".repeat(20),
    yesTotal: Math.floor(rng() * 490 + 10) * 1_000_000,
    noTotal: Math.floor(rng() * 490 + 10) * 1_000_000,
    status: statuses[Math.floor(rng() * statuses.length)],
    hotUntil: 0,
    createdAt: now - Math.floor(rng() * 3540 + 60),
    expiresAt: now + Math.floor(rng() * 6900 + 300),
    outcome: "pending",
    _mock: true,
  };
}

function generateMockVaults(count: number): any[] {
  const vaults: any[] = [];
  for (let i = 1; i <= count; i++) {
    vaults.push(generateMockVault(`0x${i.toString(16).padStart(64, "0")}`));
  }
  return vaults;
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message ?? String(err) }));
  process.exit(1);
});
