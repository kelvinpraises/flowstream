"""status — protocol dashboard

Delegates to @flowstream/sdk-options via the status bridge script.
Falls back to the legacy Python ChainClient when bridges are unavailable.
"""
import time

import typer
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.live import Live

from flowstream_cli.bridge import (
    BridgeError,
    bridge_args_from_config,
    call_bridge,
)
from flowstream_cli.config import get_config

app = typer.Typer(help="Protocol status dashboard")
console = Console()

EXPLORER = "https://testnet.arcscan.app"


def _usdc_fmt(raw: int) -> str:
    return f"{raw / 1_000_000:.2f}"


def _flow_fmt(raw: int) -> str:
    return f"{raw / 1e18:.4f}"


def _fetch_status(config: dict) -> dict:
    """
    Fetch protocol status via the status bridge.
    Returns a dict with protocol, vaults, wallet sections.
    Falls back to legacy ChainClient on bridge failure.
    """
    bridge_args = bridge_args_from_config(config)
    wallet_addr = config.get("wallet_address")
    if wallet_addr:
        bridge_args["walletAddress"] = wallet_addr

    try:
        return call_bridge("status", bridge_args, show_mock_warning=False)
    except (BridgeError, FileNotFoundError, TimeoutError):
        # Fallback to legacy client
        return _legacy_fetch_status(config)


def _build_dashboard(config: dict, data: dict) -> Panel:
    is_mock = data.get("_mock", False)
    protocol = data.get("protocol", {})
    vaults_data = data.get("vaults", {})
    wallet_data = data.get("wallet")

    # Protocol panel
    proto_table = Table(show_header=False, box=None)
    proto_table.add_column("key", style="dim", min_width=20)
    proto_table.add_column("value", style="cyan")
    proto_table.add_row("Chain", f"Arc Testnet ({config.get('chain_id', 5042002)})")
    proto_table.add_row("RPC", config.get("rpc_url", ""))
    proto_table.add_row("Explorer", EXPLORER)
    proto_table.add_row("ProtocolLP TVL", f"{_usdc_fmt(protocol.get('lpTotal', 0))} USDC")
    proto_table.add_row("$FLOW supply", f"{_flow_fmt(protocol.get('flowSupply', 0))} FLOW")
    proto_table.add_row("$FLOW staked", f"{_flow_fmt(protocol.get('flowStaked', 0))} FLOW")
    proto_panel = Panel(proto_table, title="[bold]Protocol[/bold]")

    # Vaults panel
    vaults_table = Table(show_header=False, box=None)
    vaults_table.add_column("key", style="dim", min_width=20)
    vaults_table.add_column("value", style="cyan")
    vaults_table.add_row("Total vaults", str(vaults_data.get("total", 0)))
    vaults_table.add_row("Active (open/hot)", str(vaults_data.get("active", 0)))
    total_yes = vaults_data.get("totalYes", 0)
    total_no = vaults_data.get("totalNo", 0)
    vaults_table.add_row("Total YES pool", f"{_usdc_fmt(total_yes)} USDC")
    vaults_table.add_row("Total NO pool", f"{_usdc_fmt(total_no)} USDC")
    vaults_table.add_row("Total locked", f"{_usdc_fmt(total_yes + total_no)} USDC")
    vaults_panel = Panel(vaults_table, title="[bold]Vaults[/bold]")

    # Wallet panel
    if wallet_data:
        wallet_table = Table(show_header=False, box=None)
        wallet_table.add_column("key", style="dim", min_width=20)
        wallet_table.add_column("value", style="cyan")
        addr = wallet_data.get("address", "")
        wallet_table.add_row("Address", f"{addr[:10]}...{addr[-6:]}" if len(addr) > 16 else addr)
        wallet_table.add_row("USDC balance", f"{_usdc_fmt(wallet_data.get('usdcBalance', 0))} USDC")
        wallet_table.add_row("$FLOW balance", f"{_flow_fmt(wallet_data.get('flowBalance', 0))} FLOW")
        wallet_table.add_row("$FLOW staked", f"{_flow_fmt(wallet_data.get('flowStaked', 0))} FLOW")
        wallet_table.add_row("Pending dividends", f"{_usdc_fmt(wallet_data.get('pendingDividends', 0))} USDC")
        wallet_panel = Panel(wallet_table, title="[bold]Your Wallet[/bold]")
    else:
        wallet_panel = Panel(
            "[dim]Not logged in. Run: [cyan]flowstream login[/cyan][/dim]",
            title="[bold]Wallet[/bold]",
        )

    mock_note = (
        "\n[dim yellow]Mock mode -- configure contracts with: flowstream auth set-contract[/dim yellow]"
        if is_mock else ""
    )

    combined = (
        f"[bold green]FlowStream Protocol Dashboard[/bold green]  "
        f"[dim]{time.strftime('%H:%M:%S')}[/dim]{mock_note}"
    )

    return Panel(
        Columns([proto_panel, vaults_panel, wallet_panel]),
        title=combined,
        subtitle="[dim]flowstream.xyz -- Arc Testnet[/dim]",
    )


@app.callback(invoke_without_command=True)
def status(
    ctx: typer.Context,
    watch: bool = typer.Option(False, "--watch", "-w", help="Refresh every 10s"),
    interval: int = typer.Option(10, "--interval", help="Refresh interval in seconds"),
):
    """
    Show protocol dashboard: LP balance, vault stats, your $FLOW position.

    Examples:
        flowstream status
        flowstream status --watch
        flowstream status --watch --interval 5
    """
    if ctx.invoked_subcommand is not None:
        return

    config = get_config()

    if not watch:
        with console.status("Loading protocol data..."):
            data = _fetch_status(config)
        panel = _build_dashboard(config, data)
        console.print(panel)
        return

    # Live watch mode
    console.print("[dim]Watching protocol -- Ctrl+C to exit[/dim]")
    try:
        with Live(console=console, refresh_per_second=0.1) as live:
            while True:
                data = _fetch_status(config)
                panel = _build_dashboard(config, data)
                live.update(panel)
                time.sleep(interval)
    except KeyboardInterrupt:
        console.print("\n[dim]Stopped.[/dim]")


# ---------------------------------------------------------------------------
# Legacy fallback
# ---------------------------------------------------------------------------

def _legacy_fetch_status(config: dict) -> dict:
    """Fallback to Python ChainClient for status data."""
    try:
        from flowstream_cli.chain import ChainClient
        client = ChainClient(
            rpc_url=config.get("rpc_url"),
            private_key=None,
            contracts=config.get("contracts", {}),
        )

        try:
            lp_total = client.protocol_lp_total()
        except Exception:
            lp_total = 0
        try:
            flow_supply = client.flow_total_supply()
            flow_staked_total = client.flow_total_staked()
        except Exception:
            flow_supply = flow_staked_total = 0
        try:
            vaults = client.list_vaults(limit=50)
            total_vaults = len(vaults)
            open_vaults = sum(1 for v in vaults if v["status"] in ("open", "hot"))
            total_yes = sum(v["yesTotal"] for v in vaults)
            total_no = sum(v["noTotal"] for v in vaults)
        except Exception:
            total_vaults = open_vaults = total_yes = total_no = 0

        result = {
            "protocol": {
                "lpTotal": lp_total,
                "surplus": 0,
                "flowSupply": flow_supply,
                "flowStaked": flow_staked_total,
            },
            "vaults": {
                "total": total_vaults,
                "active": open_vaults,
                "totalYes": total_yes,
                "totalNo": total_no,
            },
            "wallet": None,
            "_mock": not any(config.get("contracts", {}).get(k) for k in ("vault", "flow_token", "protocol_lp")),
        }

        addr = config.get("wallet_address")
        if addr:
            try:
                result["wallet"] = {
                    "address": addr,
                    "usdcBalance": client.usdc_balance(addr),
                    "flowBalance": client.flow_balance(addr),
                    "flowStaked": client.flow_staked(addr),
                    "pendingDividends": client.flow_pending_rewards(addr),
                }
            except Exception:
                result["wallet"] = {
                    "address": addr,
                    "usdcBalance": 0,
                    "flowBalance": 0,
                    "flowStaked": 0,
                    "pendingDividends": 0,
                }

        return result
    except Exception:
        return {
            "protocol": {"lpTotal": 0, "surplus": 0, "flowSupply": 0, "flowStaked": 0},
            "vaults": {"total": 0, "active": 0, "totalYes": 0, "totalNo": 0},
            "wallet": None,
            "_mock": True,
        }
