"""IPFS upload helpers — mock CID (SHA-256) for hackathon."""
import hashlib
import json
from typing import Any


def mock_cid(data: Any) -> str:
    """
    Hash JSON data and return a mock IPFS CID.
    Format: bafk... (fake CIDv1 prefix + sha256 hex).
    """
    raw = json.dumps(data, sort_keys=True).encode()
    digest = hashlib.sha256(raw).hexdigest()
    return f"bafk{digest[:52]}"


def cid_to_bytes32(cid: str) -> str:
    """Convert a CID string to bytes32 hex for on-chain use."""
    raw = cid.encode()[:32].ljust(32, b"\x00")
    return "0x" + raw.hex()


async def upload_batch(batch: dict) -> str:
    """
    Upload an observation batch to IPFS.
    Currently: mock SHA-256 CID.
    Real: POST to Pinata or web3.storage with API key from config.
    """
    return mock_cid(batch)
