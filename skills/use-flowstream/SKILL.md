---
name: use-flowstream
description: >-
  Overview and router for FlowStream, the live video prediction market protocol
  on Arc. Use this skill whenever FlowStream is mentioned, when building
  prediction markets, live video markets, streaming bets, binary options on
  video, or working with the FlowStream CLI or SDKs. Also triggers when
  building any agent (bookmaker, steward, observer) for FlowStream, creating
  vaults, or asking about $FLOW tokens. Routes to the specific skill for
  detailed workflows.
---

# FlowStream Overview

FlowStream is a live video prediction market protocol built on Arc. Any live video stream -- football, esports, political debates, concerts -- becomes a surface for real-time binary options. AI agents watch the stream via computer vision, generate situational predictions, and stake their own capital on the outcome. Viewers watch real video while prediction cards float on top in Niko Niko style.

## Architecture: 4 SDK Layers

FlowStream is organized into four SDK layers, bottom to top:

```
  sdk-steward    Protocol governance agents (proposals, challenges, boosts)
  sdk-options    Consumer vault interaction (create, stream, resolve)
  sdk-bookmaker  Autonomous market-making agents (pattern detection, vault creation)
  sdk-stats      CV observation layer (video processing, WebSocket feed, IPFS batches)
```

All SDKs live in `packages/` as `@flowstream/sdk-{name}` and share types from `@flowstream/types`.

## CLI

The FlowStream CLI (`flowstream`) is the primary interface. There is no backend server -- the chain is the backend.

```
flowstream login / logout / whoami     Identity and wallet management
flowstream observe                     Start CV observation + WebSocket stats feed
flowstream agent create / run / list   Scaffold and run bookmaker or steward agents
flowstream vault create / list / stream / resolve   Vault lifecycle management
flowstream flow balance / stake / unstake / claim    $FLOW token management
flowstream status                      Protocol health dashboard
```

Install and authenticate before using any other commands:

```bash
pip install -e .                       # from cli/ directory
flowstream login --address 0xYourAddress
```

## Core Concepts

**Vault** -- A two-sided binary market. One side bets YES, the other bets NO. Each side has its own bonding curve. No central pool, no house.

**Token streaming** -- Users do not "place a bet." They stream USDC continuously into a vault side using a slider. Slow streaming is like dollar-cost-averaging. Fast streaming concentrates at the current price.

**Agents** -- Three tiers of autonomous agents: observers (extract facts from video via CV), bookmakers (detect patterns and create vaults), stewards (govern the protocol).

**$FLOW** -- Loss-to-ownership token. When you lose a bet, you receive $FLOW tokens. $FLOW holders earn a share of protocol revenue. Losers become owners.

**Hot periods** -- The adversity system. When a significant event occurs, the bonding curve steepens, exit burns activate, and small holders are temporarily locked. Panic exits strengthen the surviving vault.

## Routing Table

Based on what you want to do, use the appropriate skill:

| Intent | Skill | Examples |
|--------|-------|---------|
| Watch video, run CV, process video, start a stats feed, create observations | `create-observer` | "observe a live stream", "run ball tracking", "set up a stats provider" |
| Build a bookmaker agent, create markets automatically, make prediction bots | `create-bookmaker` | "create a bookmaker", "build a market maker", "automate vault creation" |
| Build a steward agent, govern the protocol, monitor vaults, propose boosts | `create-steward` | "create a steward", "monitor vault health", "submit a slash proposal" |
| Create a vault, make a prediction, stream USDC, bet on something, resolve | `create-vault` | "create a prediction", "stream into a vault", "resolve a bet" |

## Running the Full System (Hackathon Demo)

The entire system runs on one machine with four terminal processes:

```
Terminal 1: flowstream observe --source ./demo-match.mp4 --port 8765
Terminal 2: flowstream agent run bookmaker --ws ws://localhost:8765
Terminal 3: flowstream agent run steward --ws ws://localhost:8765
Terminal 4: cd apps/client && npm run dev
```

The observer processes video and serves a WebSocket feed. The bookmaker consumes the feed and creates vaults. The steward monitors vaults and handles governance. The client renders the video with floating prediction cards.

## Chain Details

- **Chain:** Arc Testnet (chain ID 5042002)
- **RPC:** `https://rpc.testnet.arc.network`
- **Explorer:** `https://testnet.arcscan.app`
- **Gas token:** USDC (no volatile token)
- **Settlement:** Sub-second finality

## Key Files

- `PRD.md` -- Full product requirements
- `FLOW.md` -- Technical flows, CLI reference, data schemas
- `drafts/SDK_ARCHITECTURE.md` -- SDK package architecture
- `packages/types/` -- Shared TypeScript types (`@flowstream/types`)
