# Domain: Credential Store

## Overview

The "active credential" is whatever Claude Code itself reads to authenticate — slayer-cli doesn't invent its own credential format, it writes into Claude Code's existing storage so that switching a slot makes Claude Code itself use that account on its next call.

## Storage by Platform

```
switch writes active credential
  Linux/Windows → ~/.claude/.credentials.json (0600)
      merge .claudeAiOauth: {accessToken, refreshToken=null, expiresAt (long), scopes}
      preserve all other existing keys (e.g. mcpOAuth)
  macOS → system Keychain
```

Both platforms also patch `~/.claude.json` → `.oauthAccount` (`emailAddress`, `accountUuid`, `organizationUuid`) so Claude Code's own account display matches the switched-to slot.

`CLAUDE_CONFIG_DIR` is honored wherever `~/.claude` or `~/.claude.json` paths are resolved — slayer-cli never hardcodes the home-relative path.

## Key Files

| File | Purpose |
|------|---------|
| `credstore/file_store.py` | Linux/Windows JSON credential read/merge/write |
| `credstore/keychain_store.py` | macOS Keychain read/write |
| `credstore/claude_json.py` | Patch `~/.claude.json` `.oauthAccount` |
| `platform/paths.py` | Resolves `~/.claude`, `~/.claude.json`, honoring `CLAUDE_CONFIG_DIR` |

## Key Invariants

- **Writing a credential always merges, never overwrites the whole file** — unrelated keys like `mcpOAuth` survive a switch untouched.
- **All credential files are `0600`, all credential directories are `0700`**, set on every write, not just on first creation.
- **`CLAUDE_CONFIG_DIR` overrides the default `~/.claude` location everywhere** — no module resolves the path independently of `platform/paths.py`.
