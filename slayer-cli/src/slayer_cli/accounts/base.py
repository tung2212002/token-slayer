"""Register the machine's currently active Claude login as a base account slot.

Run once at install time so a user who already uses Claude Code sees their
existing account in token-slayer immediately, without a manual `add`. Safe to
call on every (re)install: it is idempotent and identity-deduplicated.
"""
from __future__ import annotations

from slayer_cli.accounts.detect import detect_current
from slayer_cli.accounts.store import AccountStore
from slayer_cli.models.account import Account
from slayer_cli.platform.paths import Paths
from slayer_cli.usage.cache import cache_key

__all__ = ["add_base_account"]


def add_base_account(store: AccountStore, paths: Paths) -> tuple[Account | None, str]:
    """Snapshot the machine's active Claude login into a base slot, unless an
    equivalent slot already exists.

    Cases (all safe to hit on every install):
    - No active Claude login → ``(None, "none")``; nothing written.
    - A slot already carries the same identity (`cache_key` — uuid|org, then
      org, then email) → ``(that slot, "exists")``; nothing written, no
      duplicate even if the existing slot has a different name.
    - Otherwise the detected login is stored (named by its full email, matching
      the provisioned-slot convention so a later provisioned pull of the same
      account overwrites this slot instead of duplicating it) and marked active
      only when no slot is active yet → ``(account, "added")``.

    :param store: Account slot store.
    :param paths: Resolved OS paths for this namespace.
    :return: ``(account or None, status)`` where status is
        ``"added"`` | ``"exists"`` | ``"none"``.
    """
    detected = detect_current(paths)
    if detected is None:
        return None, "none"

    key = cache_key(detected)
    for existing in store.list():
        if cache_key(existing) == key:
            return existing, "exists"

    name = detected.email or detected.name
    account = detected if name == detected.name else detected.model_copy(update={"name": name})
    store.add(account)
    if store.active() is None:
        store.set_active(account.name)
    return account, "added"
