"""observe — wraps @flowstream/sdk-stats (video in → processed video out)."""
import os
import signal
import subprocess
import sys
from pathlib import Path

import typer
from rich.console import Console
from rich.panel import Panel

from flowstream_cli.config import get_config

app = typer.Typer(help="Process video through a content adapter and write output")
console = Console()

SDK_ENV_VAR = "FLOWSTREAM_SDK_STATS_PATH"


def _find_sdk_stats() -> Path:
    env_path = os.environ.get(SDK_ENV_VAR)
    if env_path:
        p = Path(env_path)
        if (p / "src" / "main.ts").exists():
            return p

    here = Path(__file__).resolve()
    candidates = [
        here.parents[4] / "packages" / "sdk-stats",
        here.parents[3] / "packages" / "sdk-stats",
        Path.cwd() / "packages" / "sdk-stats",
        Path.cwd().parent / "packages" / "sdk-stats",
    ]
    for p in candidates:
        if (p / "src" / "main.ts").exists():
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
    source: str = typer.Option(..., "--source", "-s", help="Video file path or URL"),
    acquire: str = typer.Option("file", "--acquire", help="file | webcapture"),
    content: str = typer.Option("football", "--content", help="Content adapter (e.g. football)"),
    mode: str = typer.Option("auto", "--mode", help="webcapture: auto | interactive"),
    out_file: str = typer.Option("test/result-file.mp4", "--out-file", help="Output video path"),
    debug: bool = typer.Option(False, "--debug", help="Write debug JSONL alongside video"),
    no_render: bool = typer.Option(False, "--no-render", help="Passthrough source JPEG (no pitch render)"),
    sdk_path: str = typer.Option(None, "--sdk-path", help="Path to packages/sdk-stats"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Print command and exit"),
):
    """
    Run sdk-stats: acquire → content adapter → video file output.

    Example:
        flowstream observe --source ./match.mp4 --acquire file --content football
    """
    if ctx.invoked_subcommand is not None:
        return

    sdk_dir = Path(sdk_path) if sdk_path else _find_sdk_stats()

    if not sdk_dir or not (sdk_dir / "src" / "main.ts").exists():
        console.print(
            Panel(
                f"[red]Could not find sdk-stats.[/red]\n\n"
                f"export {SDK_ENV_VAR}=/path/to/packages/sdk-stats",
                title="Missing sdk-stats",
            )
        )
        raise typer.Exit(1)

    if not _check_node():
        console.print("[red]Node.js not found (>= 18).[/red]")
        raise typer.Exit(1)

    cmd = [
        "npx",
        "tsx",
        "src/main.ts",
        "--source",
        source,
        "--acquire",
        acquire,
        "--content",
        content,
        "--mode",
        mode,
        "--output",
        "file",
        "--out-file",
        out_file,
    ]
    if debug:
        cmd.append("--debug")
    if no_render:
        cmd.append("--no-render")

    if dry_run:
        console.print(f"[dim]cwd:[/dim] {sdk_dir}")
        console.print(f"[dim]cmd:[/dim] {' '.join(cmd)}")
        return

    console.print(
        Panel(
            f"[green]sdk-stats[/green]\n"
            f"Source  : [cyan]{source}[/cyan]\n"
            f"Acquire : [cyan]{acquire}[/cyan]\n"
            f"Content : [cyan]{content}[/cyan]\n"
            f"Output  : [cyan]{out_file}[/cyan]",
            title="flowstream observe",
        )
    )

    try:
        proc = subprocess.Popen(cmd, cwd=str(sdk_dir))

        def _shutdown(sig, frame):
            console.print("\n[yellow]Shutting down...[/yellow]")
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
            console.print(f"[red]Exited with code {proc.returncode}[/red]")
            raise typer.Exit(proc.returncode)
    except FileNotFoundError:
        console.print("[red]npx not found.[/red]")
        raise typer.Exit(1)
