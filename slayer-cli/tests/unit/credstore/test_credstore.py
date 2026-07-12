import json, sys
from slayer_cli.platform.paths import Paths
from slayer_cli import credstore

def test_file_store_merges_claudeaioauth(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path)); monkeypatch.delenv("CLAUDE_CONFIG_DIR", raising=False)
    monkeypatch.setattr(sys, "platform", "linux")
    p = Paths("token_slayer")
    p.claude_credentials_file.parent.mkdir(parents=True)
    p.claude_credentials_file.write_text(json.dumps({"mcpOAuth": {"keep": 1}}))
    credstore.write_active_token(p, "sk-ant-oat01-TESTTOKEN")
    data = json.loads(p.claude_credentials_file.read_text())
    assert data["mcpOAuth"] == {"keep": 1}                       # preserved
    assert data["claudeAiOauth"]["accessToken"] == "sk-ant-oat01-TESTTOKEN"
    assert data["claudeAiOauth"]["refreshToken"] is None
    assert p.claude_credentials_file.stat().st_mode & 0o777 == 0o600
    assert credstore.read_active_token(p) == "sk-ant-oat01-TESTTOKEN"

def test_patch_oauth_account(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path)); monkeypatch.delenv("CLAUDE_CONFIG_DIR", raising=False)
    p = Paths("token_slayer")
    p.claude_json.write_text(json.dumps({"other": 1}))
    from slayer_cli.credstore import claude_json
    claude_json.patch_oauth_account(p, email="a@b.com", uuid="u1", org="org1")
    d = json.loads(p.claude_json.read_text())
    assert d["other"] == 1
    assert d["oauthAccount"] == {"emailAddress": "a@b.com", "accountUuid": "u1", "organizationUuid": "org1"}
