"""Local config management — ~/.flowstream/"""
import base64
import getpass
import hashlib
import json
import os
from pathlib import Path
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

CONFIG_DIR = Path.home() / ".flowstream"
CONFIG_FILE = CONFIG_DIR / "config.json"
AGENTS_DIR = CONFIG_DIR / "agents"

_DEFAULT_CONFIG: dict = {
    "wallet_address": None,
    "encrypted_key": None,
    "key_salt": None,
    "rpc_url": "https://rpc.testnet.arc.network",
    "chain_id": 5042002,
    "contracts": {
        "vault": None,
        "flow_token": None,
        "protocol_lp": None,
        "usdc": "0x3600000000000000000000000000000000000000",
    },
}


def get_config() -> dict:
    if not CONFIG_FILE.exists():
        return _DEFAULT_CONFIG.copy()
    with open(CONFIG_FILE) as f:
        data = json.load(f)
    merged = _DEFAULT_CONFIG.copy()
    merged.update(data)
    if "contracts" in data:
        merged["contracts"] = {**_DEFAULT_CONFIG["contracts"], **data["contracts"]}
    return merged


def save_config(config: dict) -> None:
    CONFIG_DIR.mkdir(exist_ok=True)
    AGENTS_DIR.mkdir(exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    os.chmod(CONFIG_FILE, 0o600)


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    raw = hashlib.pbkdf2_hmac("sha256", passphrase.encode(), salt, 100_000)
    return base64.urlsafe_b64encode(raw)


def encrypt_private_key(private_key: str, passphrase: str) -> tuple[str, str]:
    """Returns (encrypted_token, salt_hex)."""
    salt = os.urandom(16)
    key = _derive_key(passphrase, salt)
    token = Fernet(key).encrypt(private_key.encode()).decode()
    return token, salt.hex()


def decrypt_private_key(token: str, salt_hex: str, passphrase: str) -> str:
    salt = bytes.fromhex(salt_hex)
    key = _derive_key(passphrase, salt)
    try:
        return Fernet(key).decrypt(token.encode()).decode()
    except InvalidToken:
        raise ValueError("Wrong passphrase or corrupted key")


def require_login(config: dict) -> None:
    """Raise SystemExit(1) with a helpful message if not logged in."""
    if not config.get("wallet_address"):
        from rich.console import Console
        Console().print("[bold red]Not logged in.[/bold red] Run: [cyan]flowstream login[/cyan]")
        raise SystemExit(1)


def get_private_key(config: dict, passphrase: Optional[str] = None) -> str:
    """Decrypt and return private key, prompting for passphrase if needed."""
    token = config.get("encrypted_key")
    salt = config.get("key_salt")
    if not token or not salt:
        from rich.console import Console
        Console().print("[bold red]No private key stored.[/bold red] Run: [cyan]flowstream login[/cyan]")
        raise SystemExit(1)
    if passphrase is None:
        passphrase = getpass.getpass("Key passphrase: ")
    try:
        return decrypt_private_key(token, salt, passphrase)
    except ValueError:
        from rich.console import Console
        Console().print("[bold red]Wrong passphrase.[/bold red]")
        raise SystemExit(1)
