---
name: create-vault
description: >-
  Create and interact with FlowStream prediction vaults -- two-sided binary
  markets with bonding curves settled on Arc. Use this skill when creating
  predictions, making bets, streaming USDC into a vault, managing vault
  positions, resolving outcomes, checking vault status, or working with
  FlowStream's two-sided binary options. Triggers on: vault, prediction, bet,
  stream, wager, resolve, binary option, bonding curve, create market, place
  bet, USDC streaming, hot period, vault payout, finalize.
---

# Create and Interact with Vaults

A vault is FlowStream's core primitive: a two-sided binary market. One side bets YES, the other bets NO. Each side has its own bonding curve. There is no house, no central pool, no coordinator. Agents and bettors self-organize around each vault like antibodies stacking on a pathogen.

## Vault Lifecycle

```
1. Create         Someone creates a vault with a prediction and stakes on one side
2. Stream         Others stream USDC into YES or NO sides via bonding curves
3. Hot period     Significant events trigger steeper curves and exit burns
4. Resolve        Anyone submits proof of the outcome, challenge window opens
5. Payout         Winning side receives losing side's USDC (minus haircut)
6. $FLOW mint     Losers receive $FLOW tokens (loss-to-ownership)
```

## Prerequisites

1. FlowStream CLI installed: `pip install -e .` from the `cli/` directory
2. Logged in with a funded wallet: `flowstream login --address 0xYourAddress`
3. Contract addresses configured: `flowstream auth set-contract vault 0x...`
4. USDC on Arc testnet in your wallet

## Creating a Vault

```bash
flowstream vault create \
    --option "Team A to score next" \
    --type momentum \
    --duration 30m \
    --stake 50 \
    --side no
```

This creates a vault on Arc and stakes 50 USDC on the NO side.

### Flags

```
flowstream vault create
  --option, -o <string>    Prediction text. E.g., "Next score event before minute 70"
  --type, -t <string>      Option type: momentum | player | threshold | timing | swing
                           Default: momentum
  --duration, -d <string>  How long the vault accepts streams. Accepts: 30m, 2h, 1d,
                           or raw seconds. Default: 30m
  --stake, -s <float>      Initial USDC stake (human-readable, e.g. 50 for 50 USDC).
                           Default: 10.0
  --side <string>          Which side to stake on: yes | no. Default: yes
```

### Option Types

Five content-agnostic option types -- each maps to a different pattern:

| Type | What It Means | Example |
|------|--------------|---------|
| `momentum` | Shift in advantage | "Team A to score next" |
| `player` (performance) | Participant trending | "Player #9 gets 2+ key actions" |
| `threshold` | Pace vs. target line | "Total events over 3.5 by minute 70" |
| `timing` | When something happens | "Next event before minute 55" |
| `swing` | Reversal pattern | "Trailing side comes back" |

### Duration

Accepts human-readable formats:

```bash
--duration 5m      # 5 minutes (300 seconds)
--duration 30m     # 30 minutes
--duration 2h      # 2 hours
--duration 1d      # 1 day
--duration 300     # 300 seconds
```

### Example: Create Multiple Vaults

```bash
# Momentum vault -- 5 minutes, stake 50 USDC on NO
flowstream vault create -o "Home side scores next" -t momentum -d 5m -s 50 --side no

# Threshold vault -- 30 minutes, stake 30 USDC on YES
flowstream vault create -o "Total events over 2.5 by minute 70" -t threshold -d 30m -s 30 --side yes

# Timing vault -- 10 minutes, stake 20 USDC on NO
flowstream vault create -o "Next major event before minute 55" -t timing -d 10m -s 20 --side no
```

## Two-Sided Bonding Curves

Each side of the vault has its own independently-driven bonding curve. The price of shares increases as more capital flows in.

**NO side (house/agents):**
```
NO_share_price = base * (1 + total_YES_volume / k)^a
```
More bettors joining the YES side means a proven market, so it costs more to join the NO side.

**YES side (bettors):**
```
YES_share_price = base * (1 + time_elapsed / t)^b * (1 + certainty)^c
```
Closer to resolution means the outcome is clearer, so it costs more to bet. `certainty` is a live signal from the observer feed.

The price approaches infinity asymptotically -- vaults never technically "close," they just become economically irrational to enter.

## Streaming into a Vault

Users do not "place a bet." They stream USDC into a vault side. In the UI, this is a slider. In the CLI:

```bash
flowstream vault stream 0xVaultId... --side yes --amount 25
```

This streams 25 USDC into the YES side of the specified vault.

### Flags

```
flowstream vault stream <vault-id>
  --side <string>          yes | no
  --amount, -a <float>     USDC amount to stream (human-readable, e.g. 25 for 25 USDC)
```

### How Streaming Works

- The CLI approves the USDC spend and sends a stream transaction to the vault contract
- The bonding curve determines how many shares you get per USDC
- Earlier streams get more shares per USDC (better price)
- Later streams cost more but bet on a more certain outcome
- There is no "place bet" button -- streaming is continuous

In the web UI, the slider controls the stream rate:

```
  NO ━━━━━━●━━━━━ YES
    slow       fast

  Slide left:   stream into NO (you think it won't happen)
  Slide right:  stream into YES (you think it will happen)
  Center:       stream paused
```

## Listing Vaults

```bash
# List all open vaults
flowstream vault list

# Filter by status
flowstream vault list --status open
flowstream vault list --status hot
flowstream vault list --status resolved

# Limit results
flowstream vault list --limit 10
```

### Flags

```
flowstream vault list
  --status <string>        Filter: open | hot | locked | resolved. Default: all
  --address, -a <string>   Show vaults for a specific address
  --limit, -n <int>        Max vaults to display. Default: 20
```

The output is a rich table showing vault ID, option text, type, YES/NO pool sizes, status, and time remaining.

## Checking Vault Details

```bash
flowstream vault info 0xVaultId...
```

Shows full vault details: option text, type, creator, YES/NO pool sizes, status, outcome, expiry, and your position in the vault.

## Hot Periods

When a significant event occurs (detected by the observer), vaults may enter a **hot period**. This is the adversity system that makes FlowStream antifragile.

| State | Bonding Curve | Exit Penalty | Who Can Act |
|-------|--------------|--------------|-------------|
| **Normal** | Standard | Free exit | Everyone |
| **Warm** | Steeper | 10% burn | Top holders (>30% share) only |
| **Hot** | Much steeper | 20% burn | Top holders only |
| **Critical** | Maximum steepness | 30% burn | Top holders only |

**What happens during a hot period:**
- Small holders' positions are preserved but they cannot modify them
- Large holders can increase, decrease (with burn penalty), or flip sides
- Exit burns go to remaining holders -- panic exits strengthen the surviving vault
- New entrants pay steeper curve prices
- Duration: 30-120 seconds proportional to event significance
- After the hot period ends, positions re-lock and the curve normalizes

## Resolving a Vault

Anyone can submit a resolution once the outcome is known:

```bash
flowstream vault resolve 0xVaultId... --outcome yes --proof-cid bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
```

### Flags

```
flowstream vault resolve <vault-id>
  --outcome, -o <string>   yes | no
  --proof-cid, -c <string> IPFS CID of the observation proof. If omitted, a mock
                           CID is generated for testing.
```

### Resolution Flow

```
1. Anyone submits outcome + proof CID
   The proof CID points to the IPFS observation batch containing the event.

2. Challenge window opens (5 minutes for hackathon)
   Stewards and other participants can inspect the proof.

3a. If uncontested: resolution passes
    --> YES wins (or NO wins)
    --> Losing side USDC flows to winning side (minus haircut)
    --> Haircut goes to protocol LP
    --> Losers receive $FLOW tokens
    --> Stats provider earns fee

3b. If contested: challenger submits counter-proof
    --> Stewards evaluate competing proofs
    --> Loser of dispute gets slashed
    --> In-house steward can veto if needed (1 of 5 monthly)
```

### Payouts

- **Winners:** Receive the losing side's USDC, minus a small haircut:
  - Big wins (80%+ gain): ~5% haircut
  - Small wins (10% gain): ~15% haircut
  - Haircut goes to protocol LP and $FLOW staker dividends

- **Losers:** Lose their USDC, but receive $FLOW tokens:
  - $FLOW = claim on protocol revenue
  - Losers become protocol owners

## Vault State

On-chain vault state includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | bytes32 | Unique vault identifier |
| `option` | string | Prediction text |
| `optionType` | uint8 | 0=momentum, 1=player, 2=threshold, 3=timing, 4=swing |
| `creator` | address | Bookmaker agent that created it |
| `noTotal` / `yesTotal` | uint256 | Total USDC on each side |
| `status` | uint8 | 0=open, 1=hot, 2=locked, 3=resolved, 4=disputed |
| `outcome` | uint8 | 0=pending, 1=yes, 2=no |
| `expiresAt` | uint256 | When the vault stops accepting streams |

## $FLOW Token

Check your $FLOW balance and manage staking:

```bash
# Check balance
flowstream flow balance

# Stake $FLOW to earn USDC dividends
flowstream flow stake 500.0

# Unstake
flowstream flow unstake 200.0

# Claim pending USDC dividends
flowstream flow claim
```

$FLOW stakers earn a share of all protocol revenue: vault haircuts, hot period exit burns, and expired vault dust.

## SDK Reference

Vaults can also be managed via the TypeScript SDK:

```typescript
import { FlowStreamClient } from "@flowstream/sdk-options";

const client = new FlowStreamClient({
  contracts: { vault: "0x...", flowToken: "0x...", protocolLP: "0x..." },
  wallet: "0xYourPrivateKey",
});

// Create a vault
const { vaultId, txHash } = await client.createVault({
  option: "Team A to score next",
  optionType: "momentum",
  duration: 300,
  stake: 50_000_000n,   // 50 USDC (6 decimals)
  side: "no",
});

// Stream into a vault
await client.stream({
  vaultId: "0x...",
  side: "yes",
  amount: 25_000_000n,  // 25 USDC
});

// Read vault state
const vault = await client.getVault("0x...");
console.log(`YES: ${vault.yesTotal}, NO: ${vault.noTotal}, Status: ${vault.status}`);

// List open vaults
const vaults = await client.listVaults({ status: "open", limit: 20 });

// Get your position
const position = await client.getPosition("0xVaultId", "0xYourAddress");

// Resolve
await client.resolve({
  vaultId: "0x...",
  outcome: "yes",
  proofCid: "0x...",
});
```

Key SDK classes in `@flowstream/sdk-options` (`packages/sdk-options/`):

- `FlowStreamClient` -- main entry point for all vault and $FLOW operations
- `VaultReader` -- read vault state from chain
- `VaultWriter` -- create, stream, resolve, finalize, withdraw
- `BondingCurvePrice` -- off-chain price calculation for display
- `FlowBalance` -- read $FLOW balances and staking info
- `FlowStaking` -- stake, unstake, claim dividends
- `SessionKey` -- session key management for gasless streaming UX

## Complete Example: Vault Lifecycle

```bash
# 1. Create a vault
flowstream vault create \
    -o "Next major event before minute 70" \
    -t timing \
    -d 10m \
    -s 50 \
    --side no
# Output: Vault created! Vault ID: 0xabc123...

# 2. Check it
flowstream vault info 0xabc123...

# 3. Stream USDC into YES side
flowstream vault stream 0xabc123... --side yes --amount 25

# 4. List your active vaults
flowstream vault list --status open

# 5. Event happens -- resolve the vault
flowstream vault resolve 0xabc123... --outcome yes

# 6. Check $FLOW balance (losers received $FLOW)
flowstream flow balance

# 7. Stake $FLOW to earn protocol revenue
flowstream flow stake 100.0
```
