# FlowStream — TODO

> Hackathon deadline: **2026-05-25** (Agora Agents — Canteen/Circle/Arc)
> Judging weights: 30% Agentic Sophistication, 30% Traction, 20% Circle Tools, 20% Innovation

---

## Contracts

- [x] **Fix `Vault.sol` always-win bug** — Added `creatorSideYes` to VaultData, finalize now compares outcome to creator's staked side.
- [x] **AgentRegistry: add `getAgent()` + `getAgentList()` + `getAgentsByType()`** — Full identity + stats views.
- [x] **ObserverRegistry: add `getObserver()` + `getObserverList()`** — Matching views.
- [x] **SDK ABI mismatch fixed** — `sdk-bookmaker/registry.ts` ABI now matches contract. Added `getLeaderboard()`.
- [x] **SDK Vault ABI synced** — `creatorSideYes` added to abi.ts, reader.ts, types/vault.ts.
- [x] **Wire deployed addresses into client via env** — `app/.env` has placeholder addresses, `src/config/contracts.ts` provides shared config. All hooks fall back to mock when addresses are zero. After deployment, just update `.env`.
- [ ] **Deploy contracts to Arc testnet** — CREATE2 deployment via `deploy/main.ts`. Needs a funded deployer wallet with USDC on Arc testnet. Scoped deployment (01-core, 02-wire) is ready and resumable.
- [ ] **Wire CLI agent-register bridge to contract** — `cli/bridges/agent-register.ts` is stubbed (logs mock JSON). Needs to actually call `AgentRegistry.registerAgent()` on-chain via the SDK.

---

## Agent Scoring & Registry (ERC-8004)

- [x] **AgentRegistry contract views** — `getAgent()`, `getAgentList()`, `getAgentsByType()` all added.
- [x] **SDK leaderboard query** — `getLeaderboard(filterType?)` fetches all agents, sorts by accuracy.
- [x] **Vault -> AgentRegistry reputation wired** — `finalize()` now correctly records win/loss based on creator's staked side.
- [x] **Client: wire agents page to registry** — `agents.tsx` uses `useAgents()` hook that reads from `AgentRegistry` via viem when deployed, falls back to mock data.
- [ ] **AgentRegistry: add agent metadata** — Currently only stores `name` and `agentType`. Consider adding: `description`, `avatarCid` (IPFS) for richer profiles.
- [ ] **Unify identity systems** — Three separate registries (AgentRegistry, Steward.sol, ObserverRegistry.sol). Consider merging or cross-referencing. Low priority.

---

## Session Keys & Circle Modular Wallets

### Hackathon Path (passkey persistence)
- [x] **Implement passkey auth in React client** — `useCircleWallet` hook, `WalletContext`, `ConnectButton` with Radix Dialog portal.
- [x] **Gasless transactions via paymaster** — `paymaster: true` in `sendUserOperation`.
- [x] **Passkey credential persistence** — Stored in localStorage, auto-restored on mount.
- [x] **Wallet context + hooks** — `useCircleWallet` + `WalletProvider` wrapping app root.
- [x] **Circle Console setup** — Client key in `.env` as `VITE_CIRCLE_CLIENT_KEY` (TEST_CLIENT_KEY prefix).
- [x] **Modal animation** — Radix Dialog with `dialogIn`/`dialogOut` keyframes (opacity + scale + blur).

### Future Path (true session keys via ERC-6900)
- [ ] **Research ERC-6900 SessionKeyPlugin on Arc** — Check Circle Modules Beta Program. Would allow scoped delegation for auto-signing.
- [ ] **Session key UX** — Sign once, stream for 24h without biometric prompts. Ideal but unconfirmed on Arc.

---

## Client UI (from INTEGRATION.md)

### Priority 1 — Core Demo
- [ ] **Video player** — Replace placeholder `<video>` with real HLS player (`hls.js` or Livepeer).
- [ ] **Observer WebSocket** — Wire `useWebSocket` hook to real observer for live frame data.
- [x] **Vault contract reads** — `useVaults` reads from chain when deployed, falls back to mock with live drift simulation.
- [ ] **Stream slider -> contract** — Wire `onStream` callback to vault `stream()` via Circle wallet `sendUserOperation`.

### Priority 2 — Wallet & Token
- [x] **Wallet connection** — Circle Modular Wallets with passkey auth. USDC balance read.
- [x] **$FLOW balance + staking** — `useFlow` reads from chain when deployed, falls back to mock. Stake/unstake/claim still mock (need wallet write ops).
- [ ] **My Positions panel** — Query user's share balances across vaults. Compute P&L.

### Priority 3 — Discovery & Feed
- [ ] **Protocol stats bar** — Wire `mockProtocolStats` to real data via env placeholder addresses.
- [ ] **Play-by-play feed** — Merge observer WebSocket events + Arc contract events.
- [ ] **Homepage stream discovery** — Build stream discovery API/indexer. Low priority.
- [ ] **Lifetime vaults** — Query resolved vaults from Arc using event logs.

---

## End-to-End Testing

These are the critical paths that need to be tested once contracts are deployed on Arc testnet. Each one should be verified working before submission.

### Agent Lifecycle (CLI)
- [ ] **Agent registration** — `flowstream agent register --name "TestBot" --type bookmaker --key 0x...` → verify tx on ArcScan, confirm `AgentRegistry.getAgent()` returns the agent.
- [ ] **Agent wallet funding** — Fund agent EOA with USDC via faucet → verify `balanceOf()` returns correct amount.
- [ ] **Agent USDC approval** — Agent approves Vault contract to spend USDC → verify `allowance()`.
- [ ] **Agent creates vault** — Agent calls `createVault()` → verify vault appears in `listVaults()`, `vaultsCreated` incremented in AgentRegistry.
- [ ] **Agent reputation update** — Resolve + finalize a vault → verify `getReputation()` reflects correct win/loss.

### User Flow (React Client)
- [ ] **Passkey wallet creation** — Click Connect → Create Wallet → enter username → passkey prompt → verify MSCA address appears in nav.
- [ ] **Passkey login persistence** — Close browser, reopen → verify auto-login restores wallet without biometric re-prompt.
- [ ] **USDC balance display** — After connecting, verify USDC balance reads from Arc testnet.
- [ ] **Stream slider → on-chain tx** — Drag slider on a vault card → verify `sendUserOperation` fires, tx lands on Arc, vault pool updates.
- [ ] **Vault state polling** — Open /stream/:id → verify vault cards update every 3s from chain reads.
- [ ] **Agent leaderboard** — Open /agents → verify agents load from `AgentRegistry.getAgentList()` + `getAgent()` instead of mock data.

### Observer Pipeline
- [ ] **Observer start** — `flowstream observe --source mock` → verify WebSocket frames emitting on `ws://localhost:8765`.
- [ ] **Client WebSocket** — Open /stream/:id while observer runs → verify scoreboard elapsed time updates, play-by-play feed populates.
- [ ] **IPFS batch submission** — Observer runs for 30s+ → verify IPFS CID is submitted to `ObserverRegistry.submitBatch()`.

### Steward Governance
- [ ] **Steward registration** — Register a steward agent → verify in `Steward.sol`.
- [ ] **Proposal submission** — Steward proposes a boost/slash → verify proposal appears, challenge window starts.
- [ ] **Challenge + finalize** — Let challenge window pass → finalize → verify `successfulProposals` incremented.

### Gateway Nanopayments
- [ ] **Deposit USDC to Gateway** — Call `depositToGateway("5")` → verify on-chain deposit tx.
- [ ] **Pay for observation feed** — Call `nanopay(url)` on an x402-protected endpoint → verify 200 response with data.
- [ ] **Check Gateway balance** — Call `getNanopayBalances()` → verify wallet + gateway balances returned.

### Cross-Component
- [ ] **Full vault lifecycle** — Create vault (agent) → stream YES (user A) → stream NO (user B) → hot period triggers → resolve → finalize → withdraw → verify payouts + FLOW minting + reputation update.
- [ ] **Mock-to-live switch** — Update `.env` with deployed contract addresses → restart app → verify all hooks read from chain instead of mock data.

---

## File Moves & Cleanup

- [x] **Move client** — now at `app/`.
- [x] **Move skills** — `drafts/skills/` -> `skills/`.
- [ ] **Clean drafts/** — Remove stale copies from `drafts/` after confirming everything works from final locations.
- [ ] **Remove __pycache__** — `cli/src/flowstream_cli/__pycache__/` and `cli/src/flowstream_cli/commands/__pycache__/` got committed. Remove in a cleanup commit.

---

## Submission

- [x] **Clean git commit** — 6 sectional commits done.
- [ ] **Record 3-min demo video** — Show: live stream, vault creation, streaming, hot period, resolution, $FLOW staking, agent leaderboard.
- [ ] **Hackathon submission** — GitHub repo (public) + demo video + submission form.

---

## Circle Feature Coverage

| Feature | Status | Notes |
|---------|--------|-------|
| Arc Chain | Done | Contracts + SDKs target Arc testnet, USDC as gas |
| Gateway Nanopayments | Done | `sdk-options` wraps `@circle-fin/x402-batching` for observation feed access |
| ERC-8004 | Done | `AgentRegistry.sol` with full views + SDK leaderboard |
| Modular Wallets | Done | Passkey auth + gasless in React client via `@circle-fin/modular-wallets-core` |
| Paymaster (gasless) | Done | `paymaster: true` via Circle Modular Wallets for end users |
| CCTP | Not started | Cross-chain USDC deposits, nice-to-have |

**Current: 5/6 implemented, 1/6 not started (CCTP)**

---

## Key Addresses (Arc Testnet)

| Contract | Address | Notes |
|----------|---------|-------|
| USDC (ERC-20) | `0x3600000000000000000000000000000000000000` | Native gas token with ERC-20 interface |
| Paymaster v0.7 | `0x31BE08D380A21fc740883c0BC434FcFc88740b58` | For gasless via `paymaster: true` |
| Paymaster v0.8 | `0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966` | Newer version |
| FlowStream contracts | TBD | Pending deployment via CREATE2 |

## Resources

- [Circle Modular Wallets Docs](https://developers.circle.com/wallets/modular)
- [Circle Modules Beta Program](https://www.circle.com/modules-beta)
- [ERC-6900 Modules Registry](https://erc6900.io/modules/)
- [Arc Account Abstraction Docs](https://docs.arc.network/arc/tools/account-abstraction)
- Research: `drafts/CIRCLE_MODULAR_WALLETS_RESEARCH.md`
