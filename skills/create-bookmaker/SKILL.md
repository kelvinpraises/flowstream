---
name: create-bookmaker
description: >-
  Build and deploy a FlowStream bookmaker agent -- an autonomous AI agent that
  watches live stats, detects patterns, creates prediction vaults, and stakes
  its own USDC. Use this skill when creating a bookmaker, building a prediction
  bot, making a market-making agent, setting up automated vault creation,
  building a pattern detector, or making an agent that creates binary options
  from live data. Triggers on: bookmaker, prediction agent, market maker,
  create options, bet creation, pattern detection, autonomous agent, vault
  creation bot, trading bot, odds maker.
---

# Create Bookmaker Agent

A bookmaker agent is an autonomous AI agent that consumes a live observation feed (from the observer), detects patterns in the data, creates prediction vaults on-chain, and stakes its own USDC on the outcome. Bookmaker agents are what make FlowStream a permissionless prediction market -- anyone can build one, and they compete on accuracy.

Bookmaker agents create markets. They do not resolve them. Their incentive is simple: stake on the side they believe in, and earn when they are right. Bad agents lose money and their on-chain reputation drops.

## Lifecycle Overview

```
1. Create agent     flowstream agent create <name> --type bookmaker
2. Configure        Edit the scaffolded agent.py with your pattern logic
3. Fund wallet      Send testnet USDC to the agent's wallet
4. Run              flowstream agent run <name> --ws ws://localhost:8765
5. Monitor          flowstream agent list, flowstream vault list --status open
```

## Step 1: Create the Agent

```bash
flowstream agent create MomentumBot --type bookmaker
```

This scaffolds a new agent project at `~/.flowstream/agents/MomentumBot/`:

```
~/.flowstream/agents/MomentumBot/
  agent.py        Bookmaker agent script (edit this)
  config.json     Agent configuration
```

**What happens:**
- Creates the agent directory with a template `agent.py`
- Writes `config.json` with the agent name, type, and default WebSocket URL
- If `--register` is passed: registers an ERC-8004 identity on Arc (requires deployed AgentRegistry contract)

### Flags

```
flowstream agent create <name>
  --type, -t <string>    Agent type: bookmaker | steward | observer. Default: bookmaker
  --register             Register ERC-8004 identity on-chain (optional)
```

## Step 2: Understand the Scaffolded Agent

The generated `agent.py` connects to the observer WebSocket and listens for events:

```python
import asyncio
import json
import os
import websockets
from flowstream_cli.config import get_config
from flowstream_cli.chain import ChainClient

WS_URL = os.environ.get("FLOWSTREAM_WS", "ws://localhost:8765")

async def run():
    config = get_config()
    # client = ChainClient(config["rpc_url"], private_key=..., contracts=config["contracts"])

    async with websockets.connect(WS_URL) as ws:
        async for msg in ws:
            frame = json.loads(msg)
            events = frame.get("events", [])
            for ev in events:
                if ev.get("t") == "goal":
                    print(f"Goal! Team {ev['team']} at {ev['min']}'")
                    # client.create_vault(...)

asyncio.run(run())
```

This is a starting point. The real work is in the pattern detection logic you add.

## Step 3: Pattern Detection

Bookmaker agents detect patterns in the observation stream and create vaults when they are confident. FlowStream supports five content-agnostic option types:

| Type | What It Detects | Example Vault |
|------|----------------|---------------|
| **momentum** | Shift in advantage/pressure | "Team A to score next" |
| **performance** | Participant trending above average | "Player #9 2+ key actions this half" |
| **threshold** | Pace projection against a line | "Total score events over 3.5 by minute 70" |
| **timing** | Tempo + action frequency | "Next score event before minute 55" |
| **swing** | Historical reversal patterns | "Trailing side comes back" |

For the hackathon, ship with momentum, performance, and threshold.

### Momentum Detection (Example)

The agent buffers the last N minutes of frames and checks momentum shifts:

```python
# Pseudocode -- add to agent.py

buffer = []  # last 3 minutes of frames
MOMENTUM_THRESHOLD = 65  # possession %
SHOT_THRESHOLD = 2       # shots on target

async def check_momentum(frame):
    buffer.append(frame)
    # Keep only last 3 minutes
    cutoff = frame["ts"] - 180_000
    buffer[:] = [f for f in buffer if f["ts"] > cutoff]

    if len(buffer) < 50:
        return None  # not enough data

    avg_possession = sum(f["possession"] for f in buffer) / len(buffer)
    recent_shots = sum(
        1 for f in buffer
        for ev in f.get("events", [])
        if ev.get("t") == "shot"
    )

    if avg_possession > MOMENTUM_THRESHOLD and recent_shots >= SHOT_THRESHOLD:
        return {
            "option": "Team A to score next",
            "type": "momentum",
            "confidence": 0.72,
            "stake": 50.0,  # USDC
        }
    return None
```

### Threshold Detection (Example)

Project current pace against a target line:

```python
async def check_threshold(frame):
    if frame["min"] < 20:
        return None  # too early

    current_total = sum(frame["score"])
    minutes_played = frame["min"]
    projected = (current_total / minutes_played) * 90

    if projected > 3.5 and current_total >= 2:
        return {
            "option": f"Total goals over 3.5 by 90'",
            "type": "threshold",
            "confidence": 0.65,
            "stake": 30.0,
        }
    return None
```

### Creating the Vault On Detection

When the pattern detector fires, call the CLI's chain client to create a vault:

```python
from flowstream_cli.chain import ChainClient
from flowstream_cli.config import get_config, get_private_key

config = get_config()
pk = get_private_key(config)
client = ChainClient(
    rpc_url=config.get("rpc_url"),
    private_key=pk,
    contracts=config.get("contracts", {}),
)

# Create vault and stake on NO side
vault_id = client.create_vault(
    option="Team A to score next",
    option_type=0,          # 0=momentum
    duration=300,           # 5 minutes
    creator_stake=50_000_000,  # 50 USDC (6 decimals)
    creator_side=False,     # False = NO side
)
print(f"Vault created: {vault_id}")
```

Or use the CLI directly:

```bash
flowstream vault create \
    --option "Team A to score next" \
    --type momentum \
    --duration 5m \
    --stake 50 \
    --side no
```

## Step 4: Agent Wallet

Each bookmaker agent needs its own wallet with USDC to stake on vaults.

For the hackathon, the agent uses the wallet configured via `flowstream login`. The private key is stored encrypted at `~/.flowstream/config.json`.

For production, each agent would have a **Circle Agent Wallet** with spending policies, registered on-chain via ERC-8004.

### ERC-8004 Identity

Agents register their identity on Arc via the AgentRegistry contract. This creates an on-chain identity with:
- Wallet address
- Agent name
- Agent type (bookmaker)
- Registration timestamp

Reputation is tracked on-chain: wins, losses, vaults created, accuracy (in basis points). This is public and queryable -- users see which agents perform best.

## Step 5: Run the Agent

```bash
flowstream agent run MomentumBot --ws ws://localhost:8765
```

This starts the agent as a long-running process. It connects to the observer WebSocket, runs your pattern detection logic, and creates vaults when confident.

### Flags

```
flowstream agent run <name>
  --ws <url>     Stats WebSocket URL. Default: ws://localhost:8765
```

The agent runs until stopped with Ctrl+C.

## Step 6: Monitor

Check your agent's activity:

```bash
# List all local agents
flowstream agent list

# See vaults your agent created
flowstream vault list --status open

# Check a specific vault
flowstream vault info 0xVaultId...

# Protocol dashboard
flowstream status
```

## SDK Reference

The bookmaker agent can also be built using the TypeScript SDK directly:

```typescript
import { BookmakerAgent } from "@flowstream/sdk-bookmaker";
import { MomentumDetector, ThresholdDetector } from "@flowstream/sdk-bookmaker/patterns";

const agent = new BookmakerAgent({
  feedUrl: "ws://localhost:8765",
  wallet: "0xYourPrivateKey",
  contracts: { vault: "0x...", agentRegistry: "0x..." },
  name: "MomentumBot",
  detectors: [new MomentumDetector(), new ThresholdDetector()],
  defaultStake: 10_000_000n,  // 10 USDC
  checkInterval: 10_000,       // check every 10 seconds
});

await agent.register();  // ERC-8004 identity
await agent.start();      // connect to feed, start detection loop
```

Key SDK classes in `@flowstream/sdk-bookmaker` (`packages/sdk-bookmaker/`):

- `BookmakerAgent` -- main agent class, orchestrates the detection loop
- `PatternDetector` -- interface for custom pattern detectors
- `MomentumDetector` -- detects momentum/pressure shifts
- `ThresholdDetector` -- projects pace against target lines
- `PerformanceDetector` -- tracks participant performance trends
- `VaultCreator` -- creates vaults on-chain
- `PositionManager` -- manages agent positions (stake, adjust, exit)
- `AgentWallet` -- Circle Agent Wallet integration

## Tips

- **Start with mock mode.** Run `flowstream observe --source mock` and test your agent against synthetic data before using real video.
- **Set conservative thresholds.** A confidence of 0.65+ is a reasonable minimum. Too low and the agent creates bad vaults and loses money.
- **Limit open vaults.** The protocol enforces a max of 10 floating positions per address. The agent should self-limit to avoid hitting the cap.
- **Content-agnostic patterns.** The momentum, threshold, and performance detectors work on generic fields (`possession`/momentum, `score`, `events`). They work across any content type, not just football.
- **Track your performance.** Check `flowstream flow balance` to see how much USDC you have left. Losing agents burn through their stake quickly.
