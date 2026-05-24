"""observe — wraps @flowstream/sdk-stats Observer (spawns the TypeScript process)

Delegates to packages/sdk-stats in the monorepo. The observer is a TypeScript
process that serves a WebSocket feed of observation frames.
"""
import os
import signal
import subprocess
import sys
from pathlib import Path

import typer
from rich.console import Console
from rich.panel import Panel

from flowstream_cli.config import get_config, require_login

app = typer.Typer(help="Observe live video and serve a WebSocket stats feed")
console = Console()

SDK_ENV_VAR = "FLOWSTREAM_SDK_STATS_PATH"


def _find_sdk_stats() -> Path:
    """
    Locate the sdk-stats package directory.
    Priority: FLOWSTREAM_SDK_STATS_PATH env -> monorepo packages/ -> drafts/.
    """
    # 1. Env var
    env_path = os.environ.get(SDK_ENV_VAR)
    if env_path:
        p = Path(env_path)
        if (p / "src" / "index.ts").exists():
            return p
        console.print(f"[yellow]Warning: {SDK_ENV_VAR}={env_path} does not contain src/index.ts[/yellow]")

    # 2. Relative to this file — new monorepo layout
    # cli/src/flowstream_cli/commands/observe.py
    # -> ../../../../packages/sdk-stats
    here = Path(__file__).resolve()
    candidates = [
        # New layout: cli/src/flowstream_cli/commands/ -> packages/sdk-stats
        here.parents[4] / "packages" / "sdk-stats",
        here.parents[3] / "packages" / "sdk-stats",
        # Legacy layout: cli/app/src/flowstream_cli/commands/ -> sdk-stats/app
        here.parents[5] / "sdk-stats" / "app",
        here.parents[5] / "sdk-stats",
        here.parents[4] / "sdk-stats" / "app",
        here.parents[3] / "sdk-stats" / "app",
        # CWD-relative
        Path.cwd() / "packages" / "sdk-stats",
        Path.cwd() / "sdk-stats",
        Path.cwd().parent / "packages" / "sdk-stats",
    ]
    for p in candidates:
        if (p / "src" / "index.ts").exists():
            return p

    return None  # type: ignore


def _check_node() -> bool:
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


@app.callback(invoke_without_command=True)
def observe(
    ctx: typer.Context,
    source: str = typer.Option("mock", "--source", "-s", help="mock | video URL | file path"),
    port: int = typer.Option(8765, "--port", "-p", help="WebSocket port"),
    fps: int = typer.Option(5, "--fps", help="Frames per second"),
    ipfs_interval: int = typer.Option(30, "--ipfs-interval", help="IPFS batch interval in seconds"),
    sdk_path: str = typer.Option(None, "--sdk-path", help="Path to sdk-stats directory"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Print the command that would be run, then exit"),
):
    """
    Start video ingestion + WebSocket stats feed.

    Spawns the @flowstream/sdk-stats TypeScript observer at ws://localhost:<PORT>.
    Other services (client, bookmaker agents) connect to this WebSocket.

    Examples:
        flowstream observe                          # mock mode, port 8765
        flowstream observe --source mock --port 9000
        flowstream observe --source https://youtube.com/live/xyz
    """
    if ctx.invoked_subcommand is not None:
        return

    config = get_config()

    # Find sdk-stats
    sdk_dir = Path(sdk_path) if sdk_path else _find_sdk_stats()

    if not sdk_dir or not (sdk_dir / "src" / "index.ts").exists():
        console.print(Panel(
            "[red]Could not find @flowstream/sdk-stats package.[/red]\n\n"
            f"Set the environment variable:\n"
            f"  [cyan]export {SDK_ENV_VAR}=/path/to/packages/sdk-stats[/cyan]\n\n"
            "Or pass it directly:\n"
            f"  [cyan]flowstream observe --sdk-path /path/to/packages/sdk-stats[/cyan]",
            title="[red]Missing sdk-stats[/red]",
        ))
        raise typer.Exit(1)

    if not _check_node():
        console.print("[red]Node.js not found. Install Node.js >= 18.[/red]")
        raise typer.Exit(1)

    cmd = [
        "npx", "tsx", "src/index.ts",
        "--source", source,
        "--port", str(port),
        "--fps", str(fps),
        "--ipfs-interval", str(ipfs_interval),
    ]

    if dry_run:
        console.print(f"[dim]cwd:[/dim] {sdk_dir}")
        console.print(f"[dim]cmd:[/dim] {' '.join(cmd)}")
        return

    console.print(Panel(
        f"[green]Starting observer[/green]\n"
        f"Source  : [cyan]{source}[/cyan]\n"
        f"Port    : [cyan]ws://localhost:{port}[/cyan]\n"
        f"FPS     : [cyan]{fps}[/cyan]\n"
        f"IPFS    : every [cyan]{ipfs_interval}s[/cyan]\n"
        f"SDK dir : [dim]{sdk_dir}[/dim]",
        title="flowstream observe",
    ))

    # Observer address in config
    if config.get("wallet_address"):
        os.environ["FLOWSTREAM_OBSERVER_ADDRESS"] = config["wallet_address"]

    try:
        proc = subprocess.Popen(cmd, cwd=str(sdk_dir))

        def _shutdown(sig, frame):
            console.print("\n[yellow]Shutting down observer...[/yellow]")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
            sys.exit(0)

        signal.signal(signal.SIGINT, _shutdown)
        signal.signal(signal.SIGTERM, _shutdown)

        proc.wait()
        if proc.returncode != 0:
            console.print(f"[red]Observer exited with code {proc.returncode}[/red]")
            raise typer.Exit(proc.returncode)
    except FileNotFoundError:
        console.print("[red]npx not found. Is Node.js installed?[/red]")
        raise typer.Exit(1)
