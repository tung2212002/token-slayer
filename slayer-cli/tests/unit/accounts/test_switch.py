"""Tests for the switch service (`accounts.switch.switch_to`)."""
from __future__ import annotations

import pytest

from slayer_cli.accounts import switch as switch_mod
from slayer_cli.accounts.store import AccountStore
from slayer_cli.errors import AccountNotFound
from slayer_cli.models.account import Account
from slayer_cli.platform.paths import Paths


def test_switch_writes_creds_state_provider_history(tmp_path, monkeypatch):
    """switch_to writes creds, patches .claude.json, updates state, writes
    provider active.json, and appends a history entry — in that order."""
    monkeypatch.setenv("HOME", str(tmp_path))
    p = Paths("token_slayer")
    store = AccountStore(p)
    store.add(Account(name="oedev", email="a@b.com", org_uuid="0b3d6883", plan=None,
                      token="sk-ant-oat01-X", added_at=1))
    calls = {}
    monkeypatch.setattr(switch_mod.credstore, "write_active_token",
                        lambda paths, tok: calls.setdefault("token", tok))
    monkeypatch.setattr(switch_mod.credstore.claude_json, "patch_oauth_account",
                        lambda paths, email, uuid, org: calls.setdefault("org", org))
    acc = switch_mod.switch_to(store, "oedev", paths=p)
    assert acc.name == "oedev"
    assert calls["token"] == "sk-ant-oat01-X" and calls["org"] == "0b3d6883"
    assert store.active() == "oedev"
    assert p.active_file.exists()                    # provider written
    assert switch_mod.SwapHistory(p).recent(1)[0].to == "oedev"


def test_switch_to_missing_slot_raises_account_not_found(tmp_path, monkeypatch):
    """switch_to raises AccountNotFound when the named slot doesn't exist."""
    monkeypatch.setenv("HOME", str(tmp_path))
    p = Paths("token_slayer")
    store = AccountStore(p)
    with pytest.raises(AccountNotFound):
        switch_mod.switch_to(store, "ghost", paths=p)
