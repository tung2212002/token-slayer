"""Linux/Windows active-credential storage: merges into Claude Code's own
`.credentials.json`, mirroring ccm's `_credentials_apply` jq-merge shape."""
from __future__ import annotations
import json
import os
import time
from pathlib import Path
from slayer_cli.errors import CredentialError

SCOPES = [
    "user:file_upload",
    "user:inference",
    "user:mcp_servers",
    "user:profile",
    "user:sessions:claude_code",
]
"""OAuth scopes written into `.claudeAiOauth.scopes` on every switch."""

ONE_YEAR_MS = 31536000000
"""Milliseconds in a year, used to synthesize `.claudeAiOauth.expiresAt`."""


def write(creds_file: Path, token: str) -> None:
    """Merge `token` into `creds_file`'s `.claudeAiOauth`, preserving other keys.

    Writes atomically (temp file + replace) and leaves the file at 0600.

    :param creds_file: Path to Claude Code's `.credentials.json`.
    :param token: Raw `sk-ant-oat01-…` access token to install as active.
    :return: None
    """
    data: dict = {}
    if creds_file.is_file():
        try:
            data = json.loads(creds_file.read_text())
        except ValueError:
            data = {}
    data.setdefault("claudeAiOauth", {})
    data["claudeAiOauth"].update(
        {
            "accessToken": token,
            "refreshToken": None,
            "expiresAt": int(time.time() * 1000) + ONE_YEAR_MS,
            "scopes": SCOPES,
        }
    )
    try:
        creds_file.parent.mkdir(parents=True, exist_ok=True)
        os.chmod(creds_file.parent, 0o700)
        tmp = creds_file.with_suffix(".tmp")
        # Create the tmp file 0600 from the start (not chmod after write), so the
        # token is never briefly group/world-readable under the default umask.
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as handle:
            handle.write(json.dumps(data, indent=2))
        tmp.replace(creds_file)
    except OSError as exc:
        raise CredentialError(f"failed to write credential file: {creds_file}") from exc


def read(creds_file: Path) -> str | None:
    """Return the active access token from `creds_file`, or None if absent/unreadable.

    :param creds_file: Path to Claude Code's `.credentials.json`.
    :return: The `.claudeAiOauth.accessToken` value, or None.
    """
    if not creds_file.is_file():
        return None
    try:
        return json.loads(creds_file.read_text()).get("claudeAiOauth", {}).get("accessToken")
    except ValueError:
        return None
