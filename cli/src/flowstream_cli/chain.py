"""Arc RPC helpers -- reads and writes to FlowStream contracts on Arc Testnet.

DEPRECATED: This module is retained for backward compatibility only.
New code should use the TypeScript bridge scripts in cli/bridges/ which
delegate to the @flowstream SDK packages:

  - Vault reads:  bridges/vault-read.ts  -> @flowstream/sdk-options FlowStreamClient
  - Vault writes: bridges/vault-write.ts -> @flowstream/sdk-options FlowStreamClient
  - FLOW reads:   bridges/flow-read.ts   -> @flowstream/sdk-options FlowStreamClient
  - FLOW writes:  bridges/flow-write.ts  -> @flowstream/sdk-options FlowStreamClient
  - Status:       bridges/status.ts      -> @flowstream/sdk-options FlowStreamClient

The Python CLI commands (vault.py, flow.py, status.py) now call bridges first
and fall back to this module only when Node.js is unavailable.

SDK method mapping:
  ChainClient.create_vault()       -> FlowStreamClient.createVault()
  ChainClient.stream_to_vault()    -> FlowStreamClient.stream()
  ChainClient.resolve_vault()      -> FlowStreamClient.resolve()
  ChainClient.get_vault()          -> FlowStreamClient.getVault()
  ChainClient.list_vaults()        -> FlowStreamClient.listVaults()
  ChainClient.get_position()       -> FlowStreamClient.getPosition()
  ChainClient.flow_balance()       -> FlowStreamClient.getFlowBalance()
  ChainClient.flow_staked()        -> FlowStreamClient.getFlowBalance()
  ChainClient.flow_pending_rewards() -> FlowStreamClient.getFlowBalance()
  ChainClient.flow_total_supply()  -> FlowStreamClient.getProtocolState()
  ChainClient.flow_total_staked()  -> FlowStreamClient.getProtocolState()
  ChainClient.flow_stake()         -> FlowStreamClient.stakeFlow()
  ChainClient.flow_unstake()       -> FlowStreamClient.unstakeFlow()
  ChainClient.flow_claim()         -> FlowStreamClient.claimDividends()
  ChainClient.protocol_lp_total()  -> FlowStreamClient.getProtocolState()
  ChainClient.usdc_balance()       -> (direct viem contract call)
"""
from __future__ import annotations

import json
import warnings
from typing import Any, Optional

warnings.warn(
    "flowstream_cli.chain is deprecated. "
    "Use the TypeScript bridge scripts (cli/bridges/) which delegate to @flowstream/sdk-options.",
    DeprecationWarning,
    stacklevel=2,
)

ARC_RPC = "https://rpc.testnet.arc.network"
CHAIN_ID = 5042002
USDC_ADDRESS = "0x3600000000000000000000000000000000000000"
EXPLORER = "https://testnet.arcscan.app"

# --- Minimal ABIs -----------------------------------------------------------

VAULT_ABI = [
    # Write
    {
        "type": "function", "name": "createVault",
        "inputs": [
            {"name": "option", "type": "string"},
            {"name": "optionType", "type": "uint8"},
            {"name": "duration", "type": "uint256"},
            {"name": "creatorStake", "type": "uint256"},
            {"name": "creatorSide", "type": "bool"},
        ],
        "outputs": [{"name": "vaultId", "type": "bytes32"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "stream",
        "inputs": [
            {"name": "vaultId", "type": "bytes32"},
            {"name": "yesSide", "type": "bool"},
            {"name": "amount", "type": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "resolve",
        "inputs": [
            {"name": "vaultId", "type": "bytes32"},
            {"name": "outcome", "type": "uint8"},
            {"name": "proofCid", "type": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "finalize",
        "inputs": [{"name": "vaultId", "type": "bytes32"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "withdraw",
        "inputs": [{"name": "vaultId", "type": "bytes32"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    # Read
    {
        "type": "function", "name": "getVault",
        "inputs": [{"name": "vaultId", "type": "bytes32"}],
        "outputs": [
            {"name": "", "type": "tuple", "components": [
                {"name": "id", "type": "bytes32"},
                {"name": "option", "type": "string"},
                {"name": "optionType", "type": "uint8"},
                {"name": "creator", "type": "address"},
                {"name": "noTotal", "type": "uint256"},
                {"name": "yesTotal", "type": "uint256"},
                {"name": "noCurveK", "type": "uint256"},
                {"name": "yesCurveK", "type": "uint256"},
                {"name": "status", "type": "uint8"},
                {"name": "hotUntil", "type": "uint256"},
                {"name": "hotSeverity", "type": "uint8"},
                {"name": "createdAt", "type": "uint256"},
                {"name": "expiresAt", "type": "uint256"},
                {"name": "outcome", "type": "uint8"},
                {"name": "proofCid", "type": "bytes32"},
                {"name": "resolver", "type": "address"},
                {"name": "challengeUntil", "type": "uint256"},
            ]},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "totalVaults",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "vaultIds",
        "inputs": [{"name": "", "type": "uint256"}],
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "getPosition",
        "inputs": [
            {"name": "vaultId", "type": "bytes32"},
            {"name": "user", "type": "address"},
        ],
        "outputs": [
            {"name": "", "type": "tuple", "components": [
                {"name": "yesShares", "type": "uint256"},
                {"name": "noShares", "type": "uint256"},
                {"name": "yesDeposited", "type": "uint256"},
                {"name": "noDeposited", "type": "uint256"},
                {"name": "withdrawn", "type": "bool"},
            ]},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "getSharePrice",
        "inputs": [
            {"name": "vaultId", "type": "bytes32"},
            {"name": "yesSide", "type": "bool"},
        ],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
]

FLOW_TOKEN_ABI = [
    {
        "type": "function", "name": "balanceOf",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "totalSupply",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "staked",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "totalStaked",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "pendingRewards",
        "inputs": [{"name": "user", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "stake",
        "inputs": [{"name": "amount", "type": "uint256"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "unstake",
        "inputs": [{"name": "amount", "type": "uint256"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "claimDividends",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
]

PROTOCOL_LP_ABI = [
    {
        "type": "function", "name": "totalDeposited",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
]

ERC20_ABI = [
    {
        "type": "function", "name": "balanceOf",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function", "name": "approve",
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"},
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function", "name": "allowance",
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"},
        ],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
]

# --- Status Enums -----------------------------------------------------------

VAULT_STATUS = {0: "open", 1: "hot", 2: "locked", 3: "resolved", 4: "disputed"}
VAULT_OUTCOME = {0: "pending", 1: "yes", 2: "no"}
OPTION_TYPES = {0: "momentum", 1: "player", 2: "threshold", 3: "timing", 4: "swing"}


# --- ChainClient ------------------------------------------------------------

class ChainClient:
    """
    Wraps web3 for Arc Testnet. Falls back to mock mode when contract
    addresses are not configured (pre-deployment hackathon state).
    """

    def __init__(self, rpc_url: str, private_key: Optional[str] = None, contracts: Optional[dict] = None):
        from web3 import Web3
        from web3.middleware import ExtraDataToPOAMiddleware

        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.account = self.w3.eth.account.from_key(private_key) if private_key else None
        self.contracts = contracts or {}
        self._mock = not self.w3.is_connected()
        if self._mock:
            from rich.console import Console
            Console().print("[yellow]Chain unreachable — running in mock mode[/yellow]")

    def _contract(self, name: str, abi: list) -> Any:
        addr = self.contracts.get(name)
        if not addr:
            return None
        from web3 import Web3
        return self.w3.eth.contract(address=Web3.to_checksum_address(addr), abi=abi)

    def _send_tx(self, fn, gas: int = 500_000) -> str:
        """Build, sign, send, wait. Returns tx hash string."""
        if self._mock or not self.account:
            import hashlib, time
            fake = "0x" + hashlib.sha256(str(time.time()).encode()).hexdigest()
            return fake
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        tx = fn.build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "gas": gas,
            "gasPrice": self.w3.eth.gas_price,
            "chainId": CHAIN_ID,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return tx_hash.hex()

    # --- USDC ---

    def usdc_balance(self, address: str) -> int:
        """Returns USDC balance in raw 6-decimal units."""
        usdc_addr = self.contracts.get("usdc", USDC_ADDRESS)
        if self._mock or not self.w3.is_connected():
            return 1000_000000  # 1000 USDC mock
        from web3 import Web3
        c = self.w3.eth.contract(address=Web3.to_checksum_address(usdc_addr), abi=ERC20_ABI)
        return c.functions.balanceOf(Web3.to_checksum_address(address)).call()

    def usdc_approve(self, spender: str, amount: int) -> str:
        """Approve USDC spending."""
        usdc_addr = self.contracts.get("usdc", USDC_ADDRESS)
        from web3 import Web3
        c = self.w3.eth.contract(address=Web3.to_checksum_address(usdc_addr), abi=ERC20_ABI)
        return self._send_tx(c.functions.approve(Web3.to_checksum_address(spender), amount))

    # --- Vault ---

    def create_vault(
        self,
        option: str,
        option_type: int,
        duration: int,
        creator_stake: int,
        creator_side: bool,
    ) -> str:
        """Returns vault ID (bytes32 hex)."""
        c = self._contract("vault", VAULT_ABI)
        if not c:
            import hashlib, time
            return "0x" + hashlib.sha256(f"{option}{time.time()}".encode()).hexdigest()
        # approve first
        vault_addr = self.contracts["vault"]
        self.usdc_approve(vault_addr, creator_stake)
        return self._send_tx(
            c.functions.createVault(option, option_type, duration, creator_stake, creator_side),
            gas=600_000,
        )

    def stream_to_vault(self, vault_id: str, yes_side: bool, amount: int) -> str:
        """Stream USDC to a vault side. Returns tx hash."""
        c = self._contract("vault", VAULT_ABI)
        if not c:
            import hashlib, time
            return "0x" + hashlib.sha256(str(time.time()).encode()).hexdigest()
        vault_addr = self.contracts["vault"]
        self.usdc_approve(vault_addr, amount)
        vid = bytes.fromhex(vault_id.removeprefix("0x"))
        return self._send_tx(c.functions.stream(vid, yes_side, amount))

    def resolve_vault(self, vault_id: str, outcome: int, proof_cid: str) -> str:
        """Resolve vault. outcome: 1=yes, 2=no."""
        c = self._contract("vault", VAULT_ABI)
        if not c:
            import hashlib, time
            return "0x" + hashlib.sha256(str(time.time()).encode()).hexdigest()
        vid = bytes.fromhex(vault_id.removeprefix("0x"))
        pcid = bytes.fromhex(proof_cid.removeprefix("0x").ljust(64, "0"))[:32]
        return self._send_tx(c.functions.resolve(vid, outcome, pcid))

    def get_vault(self, vault_id: str) -> Optional[dict]:
        c = self._contract("vault", VAULT_ABI)
        if not c:
            return _mock_vault(vault_id)
        vid = bytes.fromhex(vault_id.removeprefix("0x"))
        v = c.functions.getVault(vid).call()
        return _parse_vault(v)

    def list_vaults(self, limit: int = 20) -> list[dict]:
        c = self._contract("vault", VAULT_ABI)
        if not c:
            return [_mock_vault(f"0x{i:064x}") for i in range(1, 4)]
        total = c.functions.totalVaults().call()
        vaults = []
        for i in range(min(total, limit) - 1, -1, -1):
            vid = c.functions.vaultIds(i).call()
            v = c.functions.getVault(vid).call()
            vaults.append(_parse_vault(v))
        return vaults

    def get_position(self, vault_id: str, address: str) -> dict:
        c = self._contract("vault", VAULT_ABI)
        if not c:
            return {"yesShares": 0, "noShares": 0, "yesDeposited": 0, "noDeposited": 0, "withdrawn": False}
        from web3 import Web3
        vid = bytes.fromhex(vault_id.removeprefix("0x"))
        pos = c.functions.getPosition(vid, Web3.to_checksum_address(address)).call()
        return {
            "yesShares": pos[0],
            "noShares": pos[1],
            "yesDeposited": pos[2],
            "noDeposited": pos[3],
            "withdrawn": pos[4],
        }

    # --- FlowToken ---

    def flow_balance(self, address: str) -> int:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return 0
        from web3 import Web3
        return c.functions.balanceOf(Web3.to_checksum_address(address)).call()

    def flow_staked(self, address: str) -> int:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return 0
        from web3 import Web3
        return c.functions.staked(Web3.to_checksum_address(address)).call()

    def flow_pending_rewards(self, address: str) -> int:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return 0
        from web3 import Web3
        return c.functions.pendingRewards(Web3.to_checksum_address(address)).call()

    def flow_total_supply(self) -> int:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return 0
        return c.functions.totalSupply().call()

    def flow_total_staked(self) -> int:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return 0
        return c.functions.totalStaked().call()

    def flow_stake(self, amount: int) -> str:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return "0x" + "ab" * 32
        return self._send_tx(c.functions.stake(amount))

    def flow_unstake(self, amount: int) -> str:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return "0x" + "ab" * 32
        return self._send_tx(c.functions.unstake(amount))

    def flow_claim(self) -> str:
        c = self._contract("flow_token", FLOW_TOKEN_ABI)
        if not c:
            return "0x" + "ab" * 32
        return self._send_tx(c.functions.claimDividends())

    # --- ProtocolLP ---

    def protocol_lp_total(self) -> int:
        c = self._contract("protocol_lp", PROTOCOL_LP_ABI)
        if not c:
            return 0
        return c.functions.totalDeposited().call()


# --- Helpers ----------------------------------------------------------------

def _parse_vault(raw: tuple) -> dict:
    return {
        "id": "0x" + raw[0].hex(),
        "option": raw[1],
        "optionType": OPTION_TYPES.get(raw[2], str(raw[2])),
        "creator": raw[3],
        "noTotal": raw[4],
        "yesTotal": raw[5],
        "status": VAULT_STATUS.get(raw[8], str(raw[8])),
        "hotUntil": raw[9],
        "createdAt": raw[11],
        "expiresAt": raw[12],
        "outcome": VAULT_OUTCOME.get(raw[13], "pending"),
    }


def _mock_vault(vault_id: str) -> dict:
    import random, time
    r = random.Random(vault_id)
    return {
        "id": vault_id,
        "option": r.choice([
            "Next goal before 70'",
            "Home team scores next",
            "3+ corners in first half",
            "Yellow card in next 10 min",
        ]),
        "optionType": r.choice(list(OPTION_TYPES.values())),
        "creator": "0x" + "ab" * 20,
        "noTotal": r.randint(10, 500) * 1_000000,
        "yesTotal": r.randint(10, 500) * 1_000000,
        "status": r.choice(["open", "hot", "resolved"]),
        "hotUntil": 0,
        "createdAt": int(time.time()) - r.randint(60, 3600),
        "expiresAt": int(time.time()) + r.randint(300, 7200),
        "outcome": "pending",
    }


def usdc_fmt(raw: int) -> str:
    """Format raw 6-decimal USDC as human-readable string."""
    return f"{raw / 1_000_000:.2f}"


def flow_fmt(raw: int) -> str:
    """Format raw 18-decimal FLOW as human-readable string."""
    return f"{raw / 1e18:.4f}"


def explorer_tx(tx_hash: str) -> str:
    return f"{EXPLORER}/tx/{tx_hash}"


def explorer_addr(address: str) -> str:
    return f"{EXPLORER}/address/{address}"
