"""Refresh a Claude OAuth grant without Claude Code running. Preserves every
field in the oauth block; only accessToken/refreshToken/expiresAt change."""
from __future__ import annotations
import time
import httpx
from slayer_cli.errors import SlayerError

_TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
_REFRESH_BUFFER_MS = 300_000  # 5 minutes

class RefreshError(SlayerError):
    """Raised when a token refresh fails. Never contains a token value."""

def is_expired(block: dict, *, buffer_ms: int = _REFRESH_BUFFER_MS) -> bool:
    """Return True if the block's access token is missing an expiry or expires
    within `buffer_ms` of now (so it should be refreshed before use).

    :param block: A `.claudeAiOauth` block.
    :param buffer_ms: Refresh this many ms before the real expiry.
    :return: True if the token should be refreshed.
    """
    expires_at = block.get("expiresAt")
    if not isinstance(expires_at, (int, float)):
        return True
    return expires_at - int(time.time() * 1000) < buffer_ms

def refresh_grant(block: dict, *, client: httpx.Client | None = None) -> dict:
    """Exchange the block's `refreshToken` for a fresh access token and return a
    NEW block with accessToken/refreshToken/expiresAt patched, all other keys
    preserved.

    :param block: A `.claudeAiOauth` block containing a `refreshToken`.
    :param client: Optional injected httpx client (tests).
    :return: The updated oauth block.
    :raises RefreshError: If there is no refresh token or the endpoint fails.
    """
    rt = block.get("refreshToken")
    if not rt:
        raise RefreshError("no refresh token in credential block")
    own = client is None
    c = client or httpx.Client(timeout=15.0)
    try:
        r = c.post(_TOKEN_URL, json={
            "grant_type": "refresh_token", "refresh_token": rt, "client_id": _CLIENT_ID})
    finally:
        if own:
            c.close()
    if r.status_code != 200:
        raise RefreshError(f"token refresh failed: HTTP {r.status_code}")
    data = r.json()
    if not data.get("access_token"):
        raise RefreshError("token refresh response missing access_token")
    out = dict(block)
    out["accessToken"] = data["access_token"]
    if data.get("refresh_token"):
        out["refreshToken"] = data["refresh_token"]
    if data.get("expires_in"):
        out["expiresAt"] = int(time.time() * 1000) + int(data["expires_in"]) * 1000
    return out
