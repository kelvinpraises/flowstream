"""agent — create, run, list, deploy

Agent templates reference the @flowstream SDK packages for proper
integration with the protocol.
"""
import json
import os
import signal
import subprocess
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from flowstream_cli.config import AGENTS_DIR, CONFIG_DIR, get_config, require_login

app = typer.Typer(help="FlowStream agent management")
console = Console()

AGENT_TYPES = ["bookmaker", "steward", "observer"]

# --- Templates ---------------------------------------------------------------
# Updated templates reference @flowstream SDK packages instead of
# inline Python chain interaction.

_BOOKMAKER_TEMPLATE = '''\
"""
FlowStream Bookmaker Agent -- {name}

Creates prediction vaults based on live observation data.
Connects to the @flowstream/sdk-stats WebSocket feed and opens vaults
when patterns are detected.

SDK packages used:
  - @flowstream/sdk-bookmaker  -- Agent lifecycle, pattern detection, vault creation
  - @flowstream/sdk-stats      -- Observation feed (WebSocket client)
  - @flowstream/sdk-options    -- Vault read/write operations

For a full TypeScript agent, use the SDK directly:

    import { BookmakerAgent } from "@flowstream/sdk-bookmaker";

    const agent = new BookmakerAgent({
      feedUrl: "ws://localhost:8765",
      wallet: "0x...",
      contracts: { vault: "0x...", ... },
      name: "{name}",
    });
    await agent.register();
    await agent.start();

This Python wrapper provides a quick-start for prototyping.
"""
import asyncio
import json
import os
import websockets

WS_URL = os.environ.get("FLOWSTREAM_WS", "ws://localhost:8765")

async def run():
    print(f"[bookmaker:{name!r}] Connecting to {{WS_URL}}")
    async with websockets.connect(WS_URL) as ws:
        async for msg in ws:
            frame = json.loads(msg)
            events = frame.get("events", [])
            for ev in events:
                # Content-agnostic event handling:
                # "score_change" = goal (football), kill (esports), point (debate)
                # "momentum_shift" = possession change, team fight win, etc.
                if ev.get("type") == "score_change":
                    print(f"Score change! Side {{ev.get('side', '?')}} at {{ev.get('at', '?')}}")
                    # In production, call the SDK bridge to create a vault:
                    # from flowstream_cli.bridge import call_bridge, bridge_args_from_config
                    # result = call_bridge("vault-write", {{
                    #     **bridge_args_from_config(config),
                    #     "action": "create",
                    #     "option": f"Next score within 5 min",
                    #     "optionType": "momentum",
                    #     "duration": 300,
                    #     "stake": 10_000_000,
                    #     "side": "yes",
                    #     "privateKey": private_key,
                    # }})

asyncio.run(run())
'''

_STEWARD_TEMPLATE = '''\
"""
FlowStream Steward Agent -- {name}

Monitors vaults for disputed resolutions and submits challenges.
Uses the @flowstream/sdk-steward for governance operations.

SDK packages used:
  - @flowstream/sdk-steward   -- Monitoring, proposals, challenges
  - @flowstream/sdk-options   -- Vault reads, FLOW staking

For a full TypeScript agent, use the SDK directly:

    import { StewardAgent } from "@flowstream/sdk-steward";

    const agent = new StewardAgent({
      feedUrl: "ws://localhost:8765",
      wallet: "0x...",
      contracts: { vault: "0x...", steward: "0x...", ... },
      name: "{name}",
    });
    await agent.register("community");
    await agent.start();

This Python wrapper provides a quick-start for prototyping.
"""
import asyncio
import os

async def run():
    print("[steward:'{name}'] Monitoring vaults for disputes...")
    while True:
        # In production, use the status bridge to read vault state:
        # from flowstream_cli.bridge import call_bridge, bridge_args_from_config
        # from flowstream_cli.config import get_config
        # config = get_config()
        # status = call_bridge("status", bridge_args_from_config(config))
        # vaults = status.get("vaults", {{}})
        #
        # Check for disputed vaults, verify resolution proofs against
        # observation data, submit challenges via the vault-write bridge.
        await asyncio.sleep(30)

asyncio.run(run())
'''

_OBSERVER_TEMPLATE = '''\
"""
FlowStream Observer Agent -- {name}

Watches live video and submits observation batches to the ObserverRegistry.
Wraps @flowstream/sdk-stats. For custom observers, edit this file.
"""
import subprocess, sys, os
from flowstream_cli.commands.observe import _find_sdk_stats

sdk = _find_sdk_stats()
if not sdk:
    print("@flowstream/sdk-stats not found.")
    print("Set FLOWSTREAM_SDK_STATS_PATH or ensure packages/sdk-stats exists.")
    sys.exit(1)

subprocess.run(
    ["npx", "tsx", "src/index.ts", "--source", "mock", "--port", "8765"],
    cwd=str(sdk),
)
'''


# --- Commands ----------------------------------------------------------------

@app.command()
def create(
    name: str = typer.Argument(help="Agent name (alphanumeric, hyphens ok)"),
    type_: str = typer.Option("bookmaker", "--type", "-t", help="bookmaker | steward | observer"),
    register: bool = typer.Option(False, "--register", help="Register ERC-8004 identity on-chain"),
):
    """
    Scaffold a new agent project in ~/.flowstream/agents/<name>/.
    """
    config = get_config()

    if type_ not in AGENT_TYPES:
        console.print(f"[red]Invalid type '{type_}'. Choose: {', '.join(AGENT_TYPES)}[/red]")
        raise typer.Exit(1)

    agent_dir = AGENTS_DIR / name
    if agent_dir.exists():
        console.print(f"[red]Agent '{name}' already exists at {agent_dir}[/red]")
        raise typer.Exit(1)

    agent_dir.mkdir(parents=True)

    # Write agent script
    templates = {
        "bookmaker": _BOOKMAKER_TEMPLATE,
        "steward": _STEWARD_TEMPLATE,
        "observer": _OBSERVER_TEMPLATE,
    }
    script = templates[type_].replace("{name}", name)
    (agent_dir / "agent.py").write_text(script)

    # Write agent config
    agent_config = {
        "name": name,
        "type": type_,
        "created_at": __import__("time").time(),
        "ws_url": "ws://localhost:8765",
        "sdk_packages": {
            "bookmaker": "@flowstream/sdk-bookmaker",
            "steward": "@flowstream/sdk-steward",
            "observer": "@flowstream/sdk-stats",
        }.get(type_),
    }
    (agent_dir / "config.json").write_text(json.dumps(agent_config, indent=2))

    # Register on-chain if requested
    if register and config.get("wallet_address"):
        try:
            from flowstream_cli.bridge import bridge_args_from_config, call_bridge
            bridge_args = bridge_args_from_config(config)
            bridge_args["action"] = "register"
            bridge_args["agentType"] = type_
            bridge_args["name"] = name
            result = call_bridge("agent-register", bridge_args)
            if result.get("_mock"):
                console.print("[dim]On-chain registration: AgentRegistry not yet deployed -- mock registration.[/dim]")
            else:
                console.print(f"[green]Registered on-chain![/green] Tx: [dim]{result.get('txHash', '')}[/dim]")
        except Exception as e:
            console.print(f"[dim]On-chain registration skipped: {e}[/dim]")

    console.print(Panel(
        f"[green]Agent created![/green]\n"
        f"Name    : [cyan]{name}[/cyan]\n"
        f"Type    : {type_}\n"
        f"SDK     : [dim]{agent_config.get('sdk_packages', 'n/a')}[/dim]\n"
        f"Dir     : [dim]{agent_dir}[/dim]\n"
        f"Script  : [dim]{agent_dir}/agent.py[/dim]\n\n"
        f"Run it:\n  [cyan]flowstream agent run {name}[/cyan]",
        title="flowstream agent create",
    ))


@app.command("run")
def run_agent(
    name: str = typer.Argument(help="Agent name"),
    ws: str = typer.Option("ws://localhost:8765", "--ws", help="Stats WebSocket URL"),
):
    """Start a local agent process."""
    config = get_config()
    agent_dir = AGENTS_DIR / name

    if not agent_dir.exists():
        console.print(f"[red]Agent '{name}' not found. Create it first: flowstream agent create {name}[/red]")
        raise typer.Exit(1)

    script = agent_dir / "agent.py"
    if not script.exists():
        console.print(f"[red]No agent.py in {agent_dir}[/red]")
        raise typer.Exit(1)

    env = {**os.environ, "FLOWSTREAM_WS": ws}
    if config.get("wallet_address"):
        env["FLOWSTREAM_WALLET"] = config["wallet_address"]

    console.print(Panel(
        f"[green]Starting agent[/green]\n"
        f"Name    : [cyan]{name}[/cyan]\n"
        f"Script  : [dim]{script}[/dim]\n"
        f"WS feed : [dim]{ws}[/dim]",
        title="flowstream agent run",
    ))

    proc = subprocess.Popen([sys.executable, str(script)], env=env)

    def _shutdown(sig, frame):
        console.print("\n[yellow]Stopping agent...[/yellow]")
        proc.terminate()
        proc.wait(timeout=5)
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)
    proc.wait()


@app.command("list")
def list_agents():
    """List all local agents in ~/.flowstream/agents/."""
    if not AGENTS_DIR.exists() or not any(AGENTS_DIR.iterdir()):
        console.print("[dim]No agents found. Create one: flowstream agent create <name>[/dim]")
        return

    table = Table(title="Local Agents", header_style="bold cyan")
    table.add_column("Name")
    table.add_column("Type")
    table.add_column("SDK Package")
    table.add_column("Dir")

    for agent_dir in sorted(AGENTS_DIR.iterdir()):
        cfg_file = agent_dir / "config.json"
        if cfg_file.exists():
            cfg = json.loads(cfg_file.read_text())
            table.add_row(
                cfg.get("name", agent_dir.name),
                cfg.get("type", "?"),
                cfg.get("sdk_packages", ""),
                str(agent_dir),
            )
        else:
            table.add_row(agent_dir.name, "?", "", str(agent_dir))

    console.print(table)


@app.command()
def deploy(
    name: str = typer.Argument(help="Agent name"),
    platform: str = typer.Option("fly", "--platform", "-p", help="fly | railway"),
):
    """Deploy an agent to cloud (P2 -- shows deployment instructions)."""
    agent_dir = AGENTS_DIR / name
    if not agent_dir.exists():
        console.print(f"[red]Agent '{name}' not found.[/red]")
        raise typer.Exit(1)

    # Read agent config to determine SDK package
    cfg_file = agent_dir / "config.json"
    sdk_pkg = ""
    if cfg_file.exists():
        cfg = json.loads(cfg_file.read_text())
        sdk_pkg = cfg.get("sdk_packages", "")

    console.print(Panel(
        f"[yellow]Cloud deploy for '{name}' (P2 -- not yet automated)[/yellow]\n\n"
        f"To deploy manually on [cyan]{platform}[/cyan]:\n\n"
        f"1. Install dependencies:\n"
        f"   [dim]pip install flowstream[/dim]\n"
        f"   [dim]npm install {sdk_pkg}[/dim]\n\n"
        f"2. Set env vars:\n"
        f"   [dim]FLOWSTREAM_WS=wss://your-observer.example.com[/dim]\n\n"
        f"3. Run:\n"
        f"   [dim]python {agent_dir}/agent.py[/dim]",
        title="flowstream agent deploy",
    ))
