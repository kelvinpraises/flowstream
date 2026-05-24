"""flow — $FLOW balance, stake, unstake, claim

Delegates to @flowstream/sdk-options via TypeScript bridge scripts.
Falls back to the legacy Python ChainClient when bridges are unavailable.
"""
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

app = typer.Typer(help="$FLOW token management")
console = Console()

EXPLORER = "https://testnet.arcscan.app"


def _flow_fmt(raw: int) -> str:
    """Format raw 18-decimal FLOW as human-readable string."""
    return f"{raw / 1e18:.4f}"


def _usdc_fmt(raw: int) -> str:
    """Format raw 6-decimal USDC as human-readable string."""
    return f"{raw / 1_000_000:.2f}"


def _explorer_tx(tx_hash: str) -> str:
    return f"{EXPLORER}/tx/{tx_hash}"


@app.command()
def balance(
    address: Optional[str] = typer.Option(None, "--address", "-a", help="Address to check (default: logged-in wallet)"),
):
    """Show $FLOW balance, staked amount, and pending rewards."""
    config = get_config()
    addr = address or config.get("wallet_address")
    if not addr:
        console.print("[red]No address. Pass --address or run: flowstream login[/red]")
        raise typer.Exit(1)

    with console.status("Fetching $FLOW balance..."):
        try:
            # Fetch user balance via bridge
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "balance"
            bridge_args["address"] = addr
            balance_data = call_bridge("flow-read", bridge_args)

            # Fetch protocol totals via status bridge
            status_args = bridge_args_from_config(config)
            status_data = call_bridge("status", status_args, show_mock_warning=False)
            protocol = status_data.get("protocol", {})

            wallet_balance = balance_data.get("balance", 0)
            staked = balance_data.get("staked", 0)
            pending = balance_data.get("pendingDividends", 0)
            total_supply = protocol.get("flowSupply", 0)
            total_staked = protocol.get("flowStaked", 0)

        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[dim]Bridge unavailable ({e}), falling back to legacy client...[/dim]")
            wallet_balance, staked, pending, total_supply, total_staked = _legacy_flow_balance(config, addr)

    table = Table(show_header=False, box=None)
    table.add_column("key", style="dim", min_width=18)
    table.add_column("value", style="cyan")

    table.add_row("Address", addr)
    table.add_row("Wallet balance", f"{_flow_fmt(wallet_balance)} FLOW")
    table.add_row("Staked", f"{_flow_fmt(staked)} FLOW")
    table.add_row("Pending dividends", f"{_usdc_fmt(pending)} USDC")
    table.add_row("", "")
    table.add_row("Total supply", f"{_flow_fmt(total_supply)} FLOW")
    table.add_row("Total staked", f"{_flow_fmt(total_staked)} FLOW")

    console.print(Panel(table, title="$FLOW Balance"))

    if not config.get("contracts", {}).get("flow_token"):
        console.print("[dim]Note: FlowToken contract not configured -- showing mock data.[/dim]")
        console.print("[dim]Set it with: flowstream auth set-contract flow_token 0x...[/dim]")


@app.command()
def stake(
    amount: float = typer.Argument(help="FLOW amount to stake"),
):
    """Stake $FLOW to earn USDC dividends from protocol haircuts."""
    config = get_config()
    require_login(config)

    amount_raw = int(amount * 1e18)
    console.print(f"Staking [cyan]{amount:.4f} FLOW[/cyan]...")

    with console.status("Sending transaction..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "stake"
            bridge_args["amount"] = amount_raw
            bridge_args["privateKey"] = get_private_key(config)

            result = call_bridge("flow-write", bridge_args, timeout=60)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[red]Transaction failed: {e}[/red]")
            raise typer.Exit(1)

    console.print(f"[green]Staked {amount:.4f} FLOW![/green]  Tx: [dim]{_explorer_tx(result.get('txHash', ''))}[/dim]")
    console.print("[dim]Earn USDC dividends from vault haircuts. Claim with: flowstream flow claim[/dim]")


@app.command()
def unstake(
    amount: float = typer.Argument(help="FLOW amount to unstake"),
):
    """Unstake $FLOW back to your wallet."""
    config = get_config()
    require_login(config)

    amount_raw = int(amount * 1e18)
    console.print(f"Unstaking [cyan]{amount:.4f} FLOW[/cyan]...")

    with console.status("Sending transaction..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "unstake"
            bridge_args["amount"] = amount_raw
            bridge_args["privateKey"] = get_private_key(config)

            result = call_bridge("flow-write", bridge_args, timeout=60)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[red]Transaction failed: {e}[/red]")
            raise typer.Exit(1)

    console.print(f"[green]Unstaked {amount:.4f} FLOW![/green]  Tx: [dim]{_explorer_tx(result.get('txHash', ''))}[/dim]")


@app.command()
def claim():
    """Claim pending USDC dividends from staked $FLOW."""
    config = get_config()
    require_login(config)

    # Check pending first
    with console.status("Checking pending dividends..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "balance"
            bridge_args["address"] = config["wallet_address"]
            balance_data = call_bridge("flow-read", bridge_args)
            pending = balance_data.get("pendingDividends", 0)
        except (BridgeError, FileNotFoundError, TimeoutError):
            pending = 0

    if pending == 0:
        console.print("[yellow]No pending dividends.[/yellow]")
        raise typer.Exit()

    console.print(f"Claiming [cyan]{_usdc_fmt(pending)} USDC[/cyan] in dividends...")

    with console.status("Sending transaction..."):
        try:
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "claim"
            bridge_args["privateKey"] = get_private_key(config)

            result = call_bridge("flow-write", bridge_args, timeout=60)
        except (BridgeError, FileNotFoundError, TimeoutError) as e:
            console.print(f"[red]Transaction failed: {e}[/red]")
            raise typer.Exit(1)

    console.print(f"[green]Claimed {_usdc_fmt(pending)} USDC![/green]  Tx: [dim]{_explorer_tx(result.get('txHash', ''))}[/dim]")


# ---------------------------------------------------------------------------
# Legacy fallback
# ---------------------------------------------------------------------------

def _legacy_flow_balance(config: dict, addr: str) -> tuple:
    """Fallback to Python ChainClient for FLOW balance."""
    try:
        from flowstream_cli.chain import ChainClient
        client = ChainClient(
            rpc_url=config.get("rpc_url"),
            private_key=None,
            contracts=config.get("contracts", {}),
        )
        return (
            client.flow_balance(addr),
            client.flow_staked(addr),
            client.flow_pending_rewards(addr),
            client.flow_total_supply(),
            client.flow_total_staked(),
        )
    except Exception:
        return (0, 0, 0, 0, 0)
