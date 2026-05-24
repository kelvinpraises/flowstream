"""vault — create, list, stream, resolve

Delegates to @flowstream/sdk-options via TypeScript bridge scripts.
Falls back to the legacy Python ChainClient when bridges are unavailable.
"""
import time
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from flowstream_cli.bridge import (
    BridgeError,
    bridge_args_from_config,
    call_bridge,
)
from flowstream_cli.config import get_config, get_private_key, require_login

app = typer.Typer(help="Prediction vault management")
console = Console()

# Maps for display
OPTION_TYPE_NAMES = {
    "momentum": 0, "player": 1, "threshold": 2, "timing": 3, "swing": 4,
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
}
OPTION_TYPE_LABELS = {0: "momentum", 1: "player", 2: "threshold", 3: "timing", 4: "swing"}

STATUS_COLOR = {
    "open": "green",
    "hot": "bright_red",
    "locked": "yellow",
    "resolved": "dim",
    "disputed": "red",
}


def _parse_duration(s: str) -> int:
    """Parse duration string: '30m', '2h', '1d', or raw seconds."""
    s = s.strip().lower()
    if s.endswith("m"):
        return int(s[:-1]) * 60
    if s.endswith("h"):
        return int(s[:-1]) * 3600
    if s.endswith("d"):
        return int(s[:-1]) * 86400
    return int(s)


def _fmt_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds}s"
    if seconds < 3600:
        return f"{seconds // 60}m"
    if seconds < 86400:
        return f"{seconds // 3600}h {(seconds % 3600) // 60}m"
    return f"{seconds // 86400}d"


def _usdc_fmt(raw: int) -> str:
    """Format raw 6-decimal USDC as human-readable string."""
    return f"{raw / 1_000_000:.2f}"


def _explorer_tx(tx_hash: str) -> str:
    return f"https://testnet.arcscan.app/tx/{tx_hash}"


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


@app.command("list")
def list_vaults(
    address: Optional[str] = typer.Option(None, "--address", "-a", help="Show vaults for this address"),
    limit: int = typer.Option(20, "--limit", "-n", help="Max vaults to display"),
    status: Optional[str] = typer.Option(None, "--status", help="Filter by status: open|hot|locked|resolved"),
):
    """List vaults from the protocol."""
    config = get_config()
    bridge_args = bridge_args_from_config(config)

    with console.status("Reading vaults from Arc..."):
        try:
            bridge_args["action"] = "list"
            bridge_args["filters"] = {"limit": limit}
            if status:
                bridge_args["filters"]["status"] = status.lower()

            vaults = call_bridge("vault-read", bridge_args)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            # Fallback to legacy ChainClient
            console.print(f"[dim]Bridge unavailable ({e}), falling back to legacy client...[/dim]")
            vaults = _legacy_list_vaults(config, limit, status)

    if not isinstance(vaults, list):
        vaults = []

    if not vaults:
        console.print("[dim]No vaults found.[/dim]")
        return

    table = Table(title=f"Vaults ({len(vaults)})", show_header=True, header_style="bold cyan")
    table.add_column("ID", style="dim", max_width=12)
    table.add_column("Option", max_width=30)
    table.add_column("Type")
    table.add_column("YES (USDC)", justify="right")
    table.add_column("NO (USDC)", justify="right")
    table.add_column("Status")
    table.add_column("Expires")

    for v in vaults:
        vid = v.get("id", "")
        short_id = vid[:10] + "..." if len(vid) > 10 else vid
        vault_status = v.get("status", "unknown")
        color = STATUS_COLOR.get(vault_status, "white")
        expires_at = v.get("expiresAt", 0)
        expires_in = expires_at - int(time.time())
        expires_str = _fmt_duration(expires_in) if expires_in > 0 else "[dim]expired[/dim]"

        table.add_row(
            short_id,
            v.get("option", ""),
            v.get("optionType", ""),
            _usdc_fmt(v.get("yesTotal", 0)),
            _usdc_fmt(v.get("noTotal", 0)),
            f"[{color}]{vault_status}[/{color}]",
            expires_str,
        )

    console.print(table)


@app.command()
def info(
    vault_id: str = typer.Argument(help="Vault ID (0x...)"),
):
    """Show full details for a single vault."""
    config = get_config()
    bridge_args = bridge_args_from_config(config)

    with console.status("Fetching vault..."):
        try:
            bridge_args["action"] = "info"
            bridge_args["vaultId"] = vault_id
            v = call_bridge("vault-read", bridge_args)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[dim]Bridge unavailable ({e}), falling back to legacy client...[/dim]")
            v = _legacy_get_vault(config, vault_id)

    if not v:
        console.print(f"[red]Vault not found: {vault_id}[/red]")
        raise typer.Exit(1)

    # Fetch position if logged in
    pos = None
    user_addr = config.get("wallet_address")
    if user_addr:
        try:
            pos_args = bridge_args_from_config(config)
            pos_args["action"] = "position"
            pos_args["vaultId"] = vault_id
            pos_args["userAddress"] = user_addr
            pos = call_bridge("vault-read", pos_args, show_mock_warning=False)
        except Exception:
            pos = None

    color = STATUS_COLOR.get(v.get("status", ""), "white")
    expires_in = v.get("expiresAt", 0) - int(time.time())

    lines = [
        f"Option   : [cyan]{v.get('option', '')}[/cyan]",
        f"Type     : {v.get('optionType', '')}",
        f"Creator  : [dim]{v.get('creator', '')}[/dim]",
        f"YES pool : [green]{_usdc_fmt(v.get('yesTotal', 0))} USDC[/green]",
        f"NO pool  : [red]{_usdc_fmt(v.get('noTotal', 0))} USDC[/red]",
        f"Status   : [{color}]{v.get('status', '')}[/{color}]",
        f"Outcome  : {v.get('outcome', 'pending')}",
        f"Expires  : {'in ' + _fmt_duration(expires_in) if expires_in > 0 else 'expired'}",
    ]

    if pos and (pos.get("yesDeposited", 0) or pos.get("noDeposited", 0)):
        lines.append("")
        lines.append("[bold]Your position[/bold]")
        if pos.get("yesDeposited", 0):
            lines.append(f"  YES     : {_usdc_fmt(pos['yesDeposited'])} USDC deposited")
        if pos.get("noDeposited", 0):
            lines.append(f"  NO      : {_usdc_fmt(pos['noDeposited'])} USDC deposited")

    console.print(Panel("\n".join(lines), title=f"Vault {vault_id[:16]}..."))


@app.command()
def create(
    option: str = typer.Option(..., "--option", "-o", help="Prediction text, e.g. 'Next goal before 70 min'"),
    type_: str = typer.Option("momentum", "--type", "-t", help="Type: momentum|player|threshold|timing|swing"),
    duration: str = typer.Option("30m", "--duration", "-d", help="Duration: 30m, 2h, 1d, or seconds"),
    stake: float = typer.Option(10.0, "--stake", "-s", help="Creator stake in USDC"),
    side: str = typer.Option("yes", "--side", help="Creator's side: yes | no"),
):
    """Create a new prediction vault on Arc."""
    config = get_config()
    require_login(config)

    option_type = OPTION_TYPE_NAMES.get(type_.lower())
    if option_type is None:
        console.print(f"[red]Invalid type '{type_}'. Choose: {', '.join(OPTION_TYPE_LABELS.values())}[/red]")
        raise typer.Exit(1)

    if side.lower() not in ("yes", "no"):
        console.print("[red]--side must be 'yes' or 'no'[/red]")
        raise typer.Exit(1)

    duration_secs = _parse_duration(duration)
    stake_raw = int(stake * 1_000_000)  # USDC 6 decimals

    console.print(f"Creating vault: [cyan]{option}[/cyan]")
    console.print(f"  Type     : {type_} ({option_type})")
    console.print(f"  Duration : {duration} ({duration_secs}s)")
    console.print(f"  Stake    : {stake:.2f} USDC on {side.upper()}")

    with console.status("Sending transaction..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "create"
            bridge_args["option"] = option
            bridge_args["optionType"] = OPTION_TYPE_LABELS.get(option_type, "momentum")
            bridge_args["duration"] = duration_secs
            bridge_args["stake"] = stake_raw
            bridge_args["side"] = side.lower()
            bridge_args["privateKey"] = get_private_key(config)

            result = call_bridge("vault-write", bridge_args, timeout=60)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[red]Transaction failed: {e}[/red]")
            raise typer.Exit(1)

    vault_id = result.get("vaultId", "unknown")
    tx_hash = result.get("txHash", "")

    console.print(Panel(
        f"[green]Vault created![/green]\n"
        f"Vault ID : [cyan]{vault_id}[/cyan]\n"
        f"Option   : {option}\n"
        f"Expires  : {duration} from now\n"
        f"Tx       : [dim]{_explorer_tx(tx_hash)}[/dim]",
        title="flowstream vault create",
    ))


@app.command()
def stream(
    vault_id: str = typer.Argument(help="Vault ID (0x...)"),
    side: str = typer.Option(..., "--side", help="yes | no"),
    amount: float = typer.Option(..., "--amount", "-a", help="USDC amount to stream"),
):
    """Stream USDC into a vault side."""
    config = get_config()
    require_login(config)

    if side.lower() not in ("yes", "no"):
        console.print("[red]--side must be 'yes' or 'no'[/red]")
        raise typer.Exit(1)

    yes_side = side.lower() == "yes"
    amount_raw = int(amount * 1_000_000)

    console.print(
        f"Streaming [cyan]{amount:.2f} USDC[/cyan] to "
        f"[{'green' if yes_side else 'red'}]{'YES' if yes_side else 'NO'}[/{'green' if yes_side else 'red'}] "
        f"side of vault [dim]{vault_id[:16]}...[/dim]"
    )

    with console.status("Sending transaction..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "stream"
            bridge_args["vaultId"] = vault_id
            bridge_args["side"] = side.lower()
            bridge_args["amount"] = amount_raw
            bridge_args["privateKey"] = get_private_key(config)

            result = call_bridge("vault-write", bridge_args, timeout=60)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[red]Transaction failed: {e}[/red]")
            raise typer.Exit(1)

    console.print(f"[green]Streamed![/green] Tx: [dim]{_explorer_tx(result.get('txHash', ''))}[/dim]")


@app.command()
def resolve(
    vault_id: str = typer.Argument(help="Vault ID (0x...)"),
    outcome: str = typer.Option(..., "--outcome", "-o", help="yes | no"),
    proof_cid: str = typer.Option(None, "--proof-cid", "-c", help="IPFS CID of observation proof"),
):
    """Submit a resolution for a vault."""
    config = get_config()
    require_login(config)

    if outcome.lower() not in ("yes", "no"):
        console.print("[red]--outcome must be 'yes' or 'no'[/red]")
        raise typer.Exit(1)

    # If no CID given, generate a mock one
    if not proof_cid:
        from flowstream_cli.ipfs import mock_cid
        proof_cid = mock_cid({"vault": vault_id, "outcome": outcome})
        console.print(f"[dim]No proof CID given -- using mock: {proof_cid}[/dim]")

    from flowstream_cli.ipfs import cid_to_bytes32
    proof_bytes32 = cid_to_bytes32(proof_cid)

    with console.status("Submitting resolution..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "resolve"
            bridge_args["vaultId"] = vault_id
            bridge_args["outcome"] = outcome.lower()
            bridge_args["proofCid"] = proof_bytes32
            bridge_args["privateKey"] = get_private_key(config)

            result = call_bridge("vault-write", bridge_args, timeout=60)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[red]Transaction failed: {e}[/red]")
            raise typer.Exit(1)

    tx_hash = result.get("txHash", "")
    outcome_upper = outcome.upper()
    color = "green" if outcome.lower() == "yes" else "red"

    console.print(Panel(
        f"[green]Resolution submitted![/green]\n"
        f"Vault   : [dim]{vault_id[:16]}...[/dim]\n"
        f"Outcome : [{color}]{outcome_upper}[/{color}]\n"
        f"Proof   : [dim]{proof_cid}[/dim]\n"
        f"Tx      : [dim]{_explorer_tx(tx_hash)}[/dim]\n\n"
        f"[dim]Challenge window: 5 minutes. Run [cyan]flowstream vault finalize {vault_id[:16]}...[/cyan] after.[/dim]",
        title="flowstream vault resolve",
    ))


# ---------------------------------------------------------------------------
# Legacy fallback (used when Node.js / bridge is unavailable)
# ---------------------------------------------------------------------------


def _legacy_list_vaults(config: dict, limit: int, status: Optional[str]) -> list:
    """Fallback to Python ChainClient for vault listing."""
    try:
        from flowstream_cli.chain import ChainClient
        client = ChainClient(
            rpc_url=config.get("rpc_url"),
            private_key=None,
            contracts=config.get("contracts", {}),
        )
        vaults = client.list_vaults(limit=limit)
        if status:
            vaults = [v for v in vaults if v["status"] == status.lower()]
        return vaults
    except Exception as e:
        console.print(f"[red]Legacy fallback also failed: {e}[/red]")
        return []


def _legacy_get_vault(config: dict, vault_id: str) -> Optional[dict]:
    """Fallback to Python ChainClient for vault info."""
    try:
        from flowstream_cli.chain import ChainClient
        client = ChainClient(
            rpc_url=config.get("rpc_url"),
            private_key=None,
            contracts=config.get("contracts", {}),
        )
        return client.get_vault(vault_id)
    except Exception:
        return None
