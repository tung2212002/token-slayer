"""The switch service: makes a stored slot the active Claude account. See
`.ai/domain/switching.md` for the authoritative pipeline contract."""
from __future__ import annotations
import os
import time
from slayer_cli import credstore
from slayer_cli.provider import writer as provider_writer
from slayer_cli.accounts.history import SwapHistory
from slayer_cli.accounts.store import AccountStore
from slayer_cli.models.account import Account
from slayer_cli.models.history import SwapHistoryEntry
from slayer_cli.platform.paths import Paths

__all__ = ["switch_to", "SwapHistory"]


def switch_to(store: AccountStore, name: str, *, paths: Paths) -> Account:
    """Make the `name` slot the active Claude account.

    Pipeline (each step only runs after the previous one succeeds, so a
    failed credential write never leaves `state.json`/`active.json`
    pointing at a credential that wasn't actually written): write the
    token to the active credential store, patch `.claude.json`'s
    `.oauthAccount` block, set the active slot + touch its `last_used`,
    write the provider `active.json` attribution file (only when
    `org_uuid` is known), then append a history entry.

    :param store: Account slot store.
    :param name: Slot name to switch to.
    :param paths: Resolved OS paths for this namespace.
    :return: The `Account` that is now active.
    :raises AccountNotFound: If no slot exists for `name`.
    :raises ValidationError: If `provider.writer.write_active` is invoked
        with a blank `org_uuid`.
    """
    acc = store.get(name)
    prev = store.active()
    credstore.write_active_token(paths, acc.token)
    credstore.claude_json.patch_oauth_account(paths, acc.email, acc.uuid, acc.org_uuid)
    store.set_active(name)
    store.touch_last_used(name)
    if acc.org_uuid:
        provider_writer.write_active(paths, acc)
    SwapHistory(paths).append(
        SwapHistoryEntry(ts=int(time.time()), from_=prev, to=name, cwd=os.getcwd())
    )
    return acc
