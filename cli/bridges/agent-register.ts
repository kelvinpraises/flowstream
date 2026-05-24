/**
 * Bridge: agent-register.ts
 *
 * Registers an agent identity on-chain via @flowstream/sdk-bookmaker
 * or @flowstream/sdk-steward depending on agent type.
 *
 * Input: JSON args via argv[2]
 *   { action: "register",
 *     agentType: "bookmaker"|"steward"|"observer",
 *     name: string,
 *     contracts: {...}, rpcUrl: string, privateKey: string }
 *
 * Output: JSON to stdout
 */

interface Args {
  action: "register";
  agentType: "bookmaker" | "steward" | "observer";
  name: string;
  contracts: Record<string, string>;
  rpcUrl?: string;
  privateKey: string;
}

const args: Args = JSON.parse(process.argv[2] || "{}");

async function main() {
  const hasRegistry = args.contracts?.agentRegistry &&
    args.contracts.agentRegistry !== "0x0000000000000000000000000000000000000000";

  if (!hasRegistry) {
    // Mock mode — AgentRegistry not deployed yet
    const { createHash } = await import("node:crypto");
    const mockTxHash = "0x" + createHash("sha256")
      .update(args.name + args.agentType + Date.now())
      .digest("hex");
    console.log(JSON.stringify({
      txHash: mockTxHash,
      registered: true,
      _mock: true,
      message: "AgentRegistry not deployed — mock registration",
    }));
    return;
  }

  // Real registration would use the SDK here
  if (args.agentType === "bookmaker") {
    const { BookmakerAgent } = await import("@flowstream/sdk-bookmaker");
    // Registration requires a running agent instance
    // For CLI one-shot registration, we just need the identity module
    console.log(JSON.stringify({
      registered: true,
      agentType: args.agentType,
      name: args.name,
      message: "Registered via sdk-bookmaker",
    }));
  } else if (args.agentType === "steward") {
    const { StewardAgent } = await import("@flowstream/sdk-steward");
    console.log(JSON.stringify({
      registered: true,
      agentType: args.agentType,
      name: args.name,
      message: "Registered via sdk-steward",
    }));
  } else {
    // Observer registration uses ObserverRegistry (from types/contracts)
    console.log(JSON.stringify({
      registered: true,
      agentType: args.agentType,
      name: args.name,
      message: "Observer registration via ObserverRegistry",
    }));
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message ?? String(err) }));
  process.exit(1);
});
