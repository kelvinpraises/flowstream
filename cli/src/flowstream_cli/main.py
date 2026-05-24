"""flowstream CLI — entry point."""
import typer
from rich.console import Console

from flowstream_cli.commands import auth, observe, vault, agent, flow, status

app = typer.Typer(
    name="flowstream",
    help=(
        "FlowStream — live prediction market on Arc.\n\n"
        "Observe live video, create prediction vaults, stream USDC, "
        "manage $FLOW. Run [cyan]flowstream <command> --help[/cyan] for details."
    ),
    no_args_is_help=True,
    rich_markup_mode="rich",
)

# Sub-command groups
app.add_typer(auth.app, name="auth", help="Wallet authentication (login, logout, whoami)")
app.add_typer(vault.app, name="vault", help="Prediction vault management")
app.add_typer(agent.app, name="agent", help="FlowStream agent management")
app.add_typer(flow.app, name="flow", help="$FLOW token (balance, stake, unstake, claim)")

# Top-level commands (shortcuts)
app.add_typer(observe.app, name="observe")
app.add_typer(status.app, name="status")


# Convenience top-level aliases
@app.command()
def login(
    address: str = typer.Option(None, "--address", "-a", help="Wallet address"),
    key_file: str = typer.Option(None, "--key-file", "-k", help="Path to private key file"),
    rpc: str = typer.Option(None, "--rpc", help="Arc RPC URL"),
):
    """Store wallet credentials. Alias for: flowstream auth login"""
    from flowstream_cli.commands.auth import login as _login
    _login(address=address, key_file=key_file, rpc=rpc)


@app.command()
def logout():
    """Clear wallet credentials. Alias for: flowstream auth logout"""
    from flowstream_cli.commands.auth import logout as _logout
    _logout()


@app.command()
def whoami():
    """Show current wallet. Alias for: flowstream auth whoami"""
    from flowstream_cli.commands.auth import whoami as _whoami
    _whoami()


@app.command()
def version():
    """Show CLI version."""
    from flowstream_cli import __version__
    Console().print(f"flowstream {__version__}")


if __name__ == "__main__":
    app()
