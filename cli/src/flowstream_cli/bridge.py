"""
Bridge helper — calls TypeScript bridge scripts via subprocess.

Each bridge script lives in cli/bridges/ and communicates via JSON:
  - Input: JSON args passed as argv[2]
  - Output: JSON result printed to stdout
  - Errors: JSON { "error": "..." } printed to stderr, non-zero exit

The bridge scripts import the @flowstream SDK packages and execute
operations, making the Python CLI a thin wrapper around the TypeScript SDKs.
"""

import json
import os
import subprocess
from pathlib import Path
from typing import Any, Optional

from rich.console import Console

# Resolve the bridges directory relative to this file.
# Layout: cli/src/flowstream_cli/bridge.py -> cli/bridges/
_BRIDGES_DIR = Path(__file__).resolve().parent.parent.parent / "bridges"

# Monorepo packages root (for NODE_PATH resolution)
_PACKAGES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "packages"

console = Console()


class BridgeError(Exception):
    """Raised when a bridge script fails."""

    def __init__(self, bridge: str, message: str, stderr: str = ""):
        self.bridge = bridge
        self.stderr = stderr
        super().__init__(f"Bridge '{bridge}' failed: {message}")


def call_bridge(
    bridge_name: str,
    args: dict,
    timeout: int = 30,
    show_mock_warning: bool = True,
) -> dict:
    """
    Call a TypeScript bridge script and return parsed JSON result.

    Args:
        bridge_name: Name of the bridge script (without .ts extension).
                     Must exist in cli/bridges/{bridge_name}.ts
        args: Dictionary of arguments, serialized to JSON and passed as argv[2].
        timeout: Maximum seconds to wait for the bridge to complete.
        show_mock_warning: If True, print a warning when mock data is returned.

    Returns:
        Parsed JSON result from the bridge script's stdout.

    Raises:
        BridgeError: If the bridge script exits with non-zero code or produces
                     invalid JSON output.
        FileNotFoundError: If the bridge script does not exist.
        TimeoutError: If the bridge takes longer than `timeout` seconds.
    """
    script = _BRIDGES_DIR / f"{bridge_name}.ts"

    if not script.exists():
        raise FileNotFoundError(
            f"Bridge script not found: {script}\n"
            f"Expected at: {_BRIDGES_DIR}/{bridge_name}.ts"
        )

    # Build environment with NODE_PATH pointing to monorepo packages
    env = {**os.environ}
    if _PACKAGES_DIR.exists():
        existing = env.get("NODE_PATH", "")
        env["NODE_PATH"] = str(_PACKAGES_DIR) + (f":{existing}" if existing else "")

    cmd = ["npx", "tsx", str(script), json.dumps(args)]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
            cwd=str(_BRIDGES_DIR.parent),  # Run from cli/ directory
        )
    except subprocess.TimeoutExpired:
        raise TimeoutError(
            f"Bridge '{bridge_name}' timed out after {timeout}s"
        )
    except FileNotFoundError:
        raise BridgeError(
            bridge_name,
            "npx not found. Is Node.js installed? (requires Node.js >= 18)",
        )

    if result.returncode != 0:
        # Try to parse structured error from stderr
        stderr = result.stderr.strip()
        try:
            err_data = json.loads(stderr)
            msg = err_data.get("error", stderr)
        except (json.JSONDecodeError, TypeError):
            msg = stderr or f"Exit code {result.returncode}"
        raise BridgeError(bridge_name, msg, stderr=stderr)

    # Parse stdout as JSON
    stdout = result.stdout.strip()
    if not stdout:
        raise BridgeError(bridge_name, "No output from bridge script")

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as e:
        raise BridgeError(
            bridge_name,
            f"Invalid JSON output: {e}\nRaw output: {stdout[:200]}",
        )

    # Show mock data warning if applicable
    if show_mock_warning and isinstance(data, dict) and data.get("_mock"):
        console.print(
            "[dim yellow]SDK bridge returned mock data "
            "(contracts not configured)[/dim yellow]"
        )

    return data


def call_bridge_silent(bridge_name: str, args: dict, timeout: int = 30) -> Optional[dict]:
    """
    Like call_bridge, but returns None on error instead of raising.
    Errors are logged to console as dim warnings.
    """
    try:
        return call_bridge(bridge_name, args, timeout=timeout, show_mock_warning=False)
    except (BridgeError, FileNotFoundError, TimeoutError) as e:
        console.print(f"[dim red]Bridge error ({bridge_name}): {e}[/dim red]")
        return None


def check_node() -> bool:
    """Check if Node.js is available."""
    try:
        subprocess.run(
            ["node", "--version"],
            capture_output=True,
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def bridge_args_from_config(config: dict) -> dict:
    """
    Extract common bridge arguments (contracts, rpcUrl) from CLI config.
    Handles the Python config key naming convention (snake_case)
    and maps to the TypeScript convention (camelCase).
    """
    contracts = config.get("contracts", {})
    return {
        "contracts": {
            "vault": contracts.get("vault"),
            "flow_token": contracts.get("flow_token"),
            "protocol_lp": contracts.get("protocol_lp"),
            "usdc": contracts.get("usdc", "0x3600000000000000000000000000000000000000"),
        },
        "rpcUrl": config.get("rpc_url", "https://rpc.testnet.arc.network"),
    }
