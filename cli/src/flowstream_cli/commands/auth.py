"""auth — login, logout"""
import getpass

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

from flowstream_cli.config import (
    encrypt_private_key,
    get_config,
    save_config,
)

app = typer.Typer(help="Wallet authentication")
console = Console()


@app.command()
def login(
    address: str = typer.Option(None, "--address", "-a", help="Wallet address (0x...)"),
    key_file: str = typer.Option(None, "--key-file", "-k", help="Path to file containing private key"),
    rpc: str = typer.Option(None, "--rpc", help="Arc RPC URL (default: Arc Testnet)"),
):
    """Store wallet credentials in ~/.flowstream/config.json."""
    config = get_config()

    if not address:
        address = Prompt.ask("Wallet address")
    address = address.strip()
    if not address.startswith("0x") or len(address) != 42:
        console.print("[red]Invalid address. Must be 0x... (42 chars)[/red]")
        raise typer.Exit(1)

    # Get private key
    if key_file:
        with open(key_file) as f:
            private_key = f.read().strip()
    else:
        private_key = getpass.getpass("Private key (hidden): ").strip()

    if not private_key.startswith("0x"):
        private_key = "0x" + private_key
    if len(private_key) != 66:
        console.print("[red]Invalid private key length.[/red]")
        raise typer.Exit(1)

    # Verify address matches key
    try:
        from eth_account import Account
        derived = Account.from_key(private_key).address
        if derived.lower() != address.lower():
            console.print(
                f"[yellow]Warning: private key derives address {derived}, "
                f"not {address}. Using derived address.[/yellow]"
            )
            address = derived
    except Exception as e:
        console.print(f"[red]Key validation failed: {e}[/red]")
        raise typer.Exit(1)

    passphrase = getpass.getpass("Encryption passphrase (to protect key at rest): ")
    if not passphrase:
        console.print("[yellow]Empty passphrase — key will be weakly protected.[/yellow]")
    passphrase2 = getpass.getpass("Confirm passphrase: ")
    if passphrase != passphrase2:
        console.print("[red]Passphrases do not match.[/red]")
        raise typer.Exit(1)

    encrypted, salt = encrypt_private_key(private_key, passphrase)

    config["wallet_address"] = address
    config["encrypted_key"] = encrypted
    config["key_salt"] = salt
    if rpc:
        config["rpc_url"] = rpc

    save_config(config)

    console.print(Panel(
        f"[green]Logged in![/green]\n"
        f"Address : [cyan]{address}[/cyan]\n"
        f"RPC     : [dim]{config['rpc_url']}[/dim]\n"
        f"Config  : [dim]~/.flowstream/config.json[/dim]",
        title="flowstream login",
    ))


@app.command()
def logout():
    """Clear stored wallet credentials."""
    config = get_config()
    if not config.get("wallet_address"):
        console.print("[yellow]Not logged in.[/yellow]")
        raise typer.Exit()

    addr = config["wallet_address"]
    config["wallet_address"] = None
    config["encrypted_key"] = None
    config["key_salt"] = None
    save_config(config)

    console.print(f"[green]Logged out.[/green] Cleared credentials for [cyan]{addr}[/cyan]")


@app.command()
def whoami():
    """Show current logged-in wallet."""
    config = get_config()
    if not config.get("wallet_address"):
        console.print("[yellow]Not logged in.[/yellow]  Run: [cyan]flowstream login[/cyan]")
        raise typer.Exit()
    console.print(
        f"[green]{config['wallet_address']}[/green]  "
        f"[dim]({config.get('rpc_url', 'no rpc')})[/dim]"
    )


@app.command()
def set_contract(
    name: str = typer.Argument(help="Contract name: vault | flow_token | protocol_lp"),
    address: str = typer.Argument(help="Contract address (0x...)"),
):
    """Set a contract address in local config."""
    valid = {"vault", "flow_token", "protocol_lp"}
    if name not in valid:
        console.print(f"[red]Unknown contract '{name}'. Valid: {', '.join(valid)}[/red]")
        raise typer.Exit(1)
    config = get_config()
    config["contracts"][name] = address
    save_config(config)
    console.print(f"[green]Set[/green] contracts.{name} = [cyan]{address}[/cyan]")
