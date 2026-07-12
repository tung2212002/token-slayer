# Domain: Switching

## Overview

Switching makes a stored slot the active Claude account. It is always an explicit user action — v1 never auto-swaps. A switch touches the credential store, the local Claude config, slayer-cli's own state, the token-slayer attribution file, and a history log, in that order.

## `switch_to(name)` Pipeline

```
switch_to(name)
  → write token to the active credential store
      → patch ~/.claude.json .oauthAccount (email/uuid/org)
          → set state.json active slot + touch slot's last_used
              → write provider active.json (org_uuid, email, source="switcher")
                  → append SwapHistoryEntry to swap-history.jsonl
```

Each step only runs after the previous one succeeds — a failed credential write aborts before `state.json` or `active.json` are touched, so the recorded active slot never points at a credential that wasn't actually written.

## Key Models

| Model | Role |
|-------|------|
| `SwapHistoryEntry` | One line per switch: which slot, when, previous active slot. Appended to `swap-history.jsonl`. |

## Key Files

| File | Purpose |
|------|---------|
| `accounts/switch.py` | `switch_to()` pipeline |
| `accounts/history.py` | Append/read `swap-history.jsonl` |

## Key Invariants

- **v1 writes the GLOBAL `~/.claude/.credentials.json`** — concurrent Claude Code sessions on the same machine share one active account. This is an accepted v1 limitation; per-session isolation is future scope, not a bug to fix here.
- **No auto-swap in v1** — nothing switches accounts on the user's behalf (not on rate-limit, not on schedule).
- **`active.json` is rewritten on every switch**, not lazily — the attribution contract (see `attribution.md`) depends on it always reflecting the current slot.
