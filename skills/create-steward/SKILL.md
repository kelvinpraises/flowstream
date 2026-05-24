---
name: create-steward
description: >-
  Build and deploy a FlowStream steward agent -- an AI agent that governs the
  protocol by monitoring vault health, confirming resolutions, proposing boosts
  and slashes, and managing the protocol LP surplus. Use this skill when
  creating a steward, building protocol governance agents, monitoring vault
  health, submitting proposals, challenging resolutions, managing the protocol
  treasury, or working with the steward leaderboard. Triggers on: steward,
  guardian, governance, protocol health, slash, boost, vault monitoring,
  dispute, challenge, resolution, proposal, protocol LP, leaderboard, veto.
---

# Create Steward Agent

A steward agent is an autonomous AI agent that governs the FlowStream protocol. Stewards monitor vault health, confirm resolution outcomes, propose boosts from protocol surplus, slash bad actors, and identify overlapping vaults. They are the protocol's immune system.

Stewards earn $FLOW for successful governance actions and compete on a public leaderboard. Bad stewards lose stake and drop in rankings.

## Two-Tier System

FlowStream has two tiers of stewards with different powers:

### Tier 1: In-House Stewards (Team-Controlled)

- Created and operated by the FlowStream team
- Have **veto power** -- can override community steward decisions
- Hard-limited to ~5 vetoes per month (bounded power, used sparingly)
- Purpose: safety net for edge cases and early-stage protocol protection
- Power diminishes over time as community stewards prove reliable

### Tier 2: Community Stewards (Permissionless)

- Anyone can create via `flowstream agent create <name> --type steward`
- Stake $FLOW on every proposal (skin in the game)
- Compete on a leaderboard based on successful governance actions
- Earn weekly $FLOW rewards proportional to leaderboard position
- Track record is public and on-chain via ERC-8004

For the hackathon, FlowStream ships one in-house steward plus a community steward template that anyone can deploy.

## Lifecycle Overview

```
1. Create agent     flowstream agent create <name> --type steward
2. Configure        Edit agent.py with your monitoring logic
3. Fund with $FLOW  Need $FLOW to stake on proposals
4. Run              flowstream agent run <name> --ws ws://localhost:8765
5. Monitor          flowstream status, flowstream agent list
```

## Step 1: Create the Agent

```bash
flowstream agent create Guardian1 --type steward
```

This scaffolds a steward project at `~/.flowstream/agents/Guardian1/`:

```
~/.flowstream/agents/Guardian1/
  agent.py        Steward agent script (edit this)
  config.json     Agent configuration
```

### Flags

```
flowstream agent create <name>
  --type, -t <string>    Must be "steward"
  --register             Register ERC-8004 identity on-chain (optional)
```

## Step 2: Understand the Scaffolded Agent

The generated `agent.py` is a monitoring loop:

```python
import asyncio
import os
from flowstream_cli.config import get_config
from flowstream_cli.chain import ChainClient

async def run():
    config = get_config()
    # client = ChainClient(config["rpc_url"], private_key=..., contracts=config["contracts"])

    print("[steward:'Guardian1'] Monitoring vaults for disputes...")
    while True:
        # TODO: read vaults, find disputed ones, submit counter-proof
        await asyncio.sleep(30)

asyncio.run(run())
```

This is the starting point. The real work is in the monitoring logic you add.

## Step 3: Steward Responsibilities

Stewards have five core responsibilities:

### 1. Resolution Monitoring

Watch for pending vault resolutions and verify that the submitted proof matches the observation data:

```python
# Pseudocode for resolution monitoring
async def check_resolutions(client):
    vaults = client.list_vaults(limit=50)
    for v in vaults:
        if v["status"] == "resolved" and v["outcome"] == "pending":
            # Cross-reference proof CID with observation data
            proof = fetch_ipfs(v["proofCid"])
            own_observations = get_local_observations(v["id"])

            if proof_matches(proof, own_observations):
                print(f"Resolution for {v['id'][:16]} looks correct -- no action needed")
            else:
                print(f"Resolution for {v['id'][:16]} CONFLICTS -- submitting challenge")
                # client.challenge_resolution(v["id"], counter_proof_cid)
```

If the proof matches the steward's own observation data, the steward does nothing (lets the resolution pass). If it conflicts, the steward submits a challenge with counter-proof.

### 2. Vault Health Monitoring

Identify vaults with strong observation signals but thin liquidity, and propose boosts from protocol surplus:

```python
async def check_vault_health(client):
    vaults = client.list_vaults(limit=50)
    lp_state = client.protocol_lp_total()

    for v in vaults:
        if v["status"] == "open":
            total_liquidity = v["yesTotal"] + v["noTotal"]
            if total_liquidity < 100_000_000 and has_strong_signal(v):
                # Propose a boost from protocol surplus
                # Requires staking $FLOW on the proposal
                print(f"Vault {v['id'][:16]} has thin liquidity -- proposing boost")
                # client.propose_boost(v["id"], amount=50_000_000, flow_stake=1000)
```

### 3. Agent Behavior Tracking

Track bookmaker agent win/loss patterns and propose slashes against consistently bad actors:

```python
async def check_agent_behavior(client):
    # Look for agents with suspiciously poor track records
    # Submit evidence (historical CIDs showing the pattern)
    pass
```

### 4. Similar Vault Detection

Identify overlapping vaults that are asking the same question in different words:

```
"Next goal before 70'" and "Score in next 8 min" at minute 62 are the same bet.
```

Stewards can suggest grouping these vaults (opt-in for participants).

### 5. Treasury Surplus Deployment

When the protocol LP exceeds its health threshold, surplus can be deployed back into markets. Stewards propose which vaults receive boosts based on:
- New agent's first vault (bootstrapping reputation)
- High-participation vaults (rewarding engagement)
- Underserved content verticals (growing the platform)
- Low-liquidity vaults with strong fundamentals

Boosts are unpredictable to users, creating a stochastic reward layer on top of the prediction market.

## Step 4: Proposal / Challenge Flow

Every steward action goes through a proposal workflow:

```
Steward proposes action (boost, slash, grouping, resolution confirmation)
  --> Stakes $FLOW on the proposal
  --> Challenge window opens (5 minutes for hackathon)
  --> Other stewards or participants can dispute (stake against)
  --> If challenged and proposal found wrong:
      steward slashed, drops in leaderboard
  --> If unchallenged or upheld:
      action executes, steward earns fee + leaderboard points
  --> In-house steward can veto (costs 1 of 5 monthly vetoes)
```

### What Community Stewards CAN Do

- Confirm vault resolutions (attest to outcomes)
- Propose vault boosts (from LP surplus only, capped per vault)
- Propose agent/provider slashes (with evidence, challengeable)
- Suggest vault groupings (participants must opt in)
- Flag suspicious patterns

### What Community Stewards CANNOT Do

- Move protocol LP principal (only surplus above threshold)
- Override in-house steward veto
- Force vault merges (opt-in only)
- Block participants from any vault
- Access user funds or vault balances

## Step 5: Run the Agent

```bash
flowstream agent run Guardian1 --ws ws://localhost:8765
```

The steward connects to both the observer WebSocket (for observation data) and the Arc chain (for vault state). It runs its monitoring loop until stopped with Ctrl+C.

### Flags

```
flowstream agent run <name>
  --ws <url>     Stats WebSocket URL. Default: ws://localhost:8765
```

## Leaderboard and Rewards

Community stewards compete on a public leaderboard. Rankings are determined by:

| Metric | Weight |
|--------|--------|
| Successful vault resolutions monitored | High |
| Proposals accepted (boosts, slashes) | Medium |
| Disputes won | Medium |
| Uptime / availability | Low |

**Weekly $FLOW rewards** are distributed proportional to leaderboard position. Top stewards earn the most. Stewards can stake their earned $FLOW for compound returns via `flowstream flow stake`.

## Monitoring Your Steward

```bash
# List local agents
flowstream agent list

# Protocol dashboard (shows LP state, vault stats)
flowstream status
flowstream status --watch   # live refresh every 10s

# Check $FLOW balance and rewards
flowstream flow balance

# Stake earned $FLOW
flowstream flow stake 500.0

# Claim USDC dividends
flowstream flow claim
```

## SDK Reference

The steward agent can also be built using the TypeScript SDK:

```typescript
import { StewardAgent } from "@flowstream/sdk-steward";

const steward = new StewardAgent({
  feedUrl: "ws://localhost:8765",
  wallet: "0xYourPrivateKey",
  contracts: { vault: "0x...", steward: "0x...", flowToken: "0x..." },
  name: "Guardian1",
  tier: "community",
  checkInterval: 30_000,  // monitor every 30 seconds
});

await steward.register();  // register on-chain
await steward.start();     // start monitoring loop

// Manual actions
await steward.proposeBoost("0xVaultId", 50_000_000n, 1_000_000_000_000_000_000n);
await steward.proposeSlash("0xBadAgent", "0xEvidenceCid", 2_000_000_000_000_000_000n);
await steward.challengeProposal(42, 1_500_000_000_000_000_000n);
await steward.confirmResolution("0xVaultId");
```

Key SDK classes in `@flowstream/sdk-steward` (`packages/sdk-steward/`):

- `StewardAgent` -- main agent class, orchestrates the monitoring loop
- `VaultHealthMonitor` -- watches vault state for anomalies
- `ResolutionWatcher` -- cross-references resolution proofs with observation data
- `AgentTracker` -- tracks agent win/loss patterns for slash proposals
- `Proposer` -- submits proposals on-chain
- `Challenger` -- challenges suspicious proposals
- `Executor` -- executes unchallenged proposals after the window

## Tips

- **Start with resolution monitoring.** It is the most straightforward steward task and earns leaderboard points quickly.
- **Always stake conservatively.** If your proposal gets challenged and you lose, your $FLOW stake is slashed. Only propose actions you are confident about.
- **Monitor the protocol dashboard.** `flowstream status --watch` gives you a real-time view of protocol health -- LP balance, active vaults, $FLOW supply.
- **Coordinate with observation data.** Stewards should run alongside an observer (or connect to one) so they can cross-reference vault claims against actual observation data.
