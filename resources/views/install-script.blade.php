{!! '#!/bin/sh' !!}
# aiorg hook installer
# Installs Claude Code + Codex CLI hooks that POST to {{ $baseUrl }}.
# Token is read at runtime from ~/.config/aiorg/token (set separately
# from the profile page after regenerating).
#
# Re-running this script is safe — existing aiorg hook blocks are
# replaced, other settings in your config files are preserved.

set -e

CLAUDE_CMD="curl -s --max-time 3 -X POST '{{ $baseUrl }}' -H 'Authorization: Bearer '\$(cat ~/.config/aiorg/token) -H 'Content-Type: application/json' -d @- >/dev/null 2>&1 &"
CODEX_CMD="curl -s --max-time 3 -X POST '{{ $baseUrl }}?provider=codex' -H 'Authorization: Bearer '\$(cat ~/.config/aiorg/token) -H 'Content-Type: application/json' -d @- >/dev/null 2>&1 &"

PY=$(command -v python3 || command -v python || true)
if [ -z "$PY" ]; then
    echo "error: python3 (or python) is required to merge ~/.claude/settings.json" >&2
    exit 1
fi

# Ensure token directory exists (token itself is written separately).
mkdir -p "$HOME/.config/aiorg"

# --- Claude Code: merge into ~/.claude/settings.json ---
mkdir -p "$HOME/.claude"
SETTINGS="$HOME/.claude/settings.json"
[ -s "$SETTINGS" ] || echo '{}' > "$SETTINGS"

CLAUDE_CMD="$CLAUDE_CMD" "$PY" - "$SETTINGS" <<'PY'
import json, os, sys

path = sys.argv[1]
cmd = os.environ["CLAUDE_CMD"]
events = [
    "SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse",
    "Stop", "SubagentStop", "SessionEnd", "Notification",
]

with open(path) as f:
    data = json.load(f)

data.setdefault("hooks", {})
for event in events:
    data["hooks"][event] = [{"hooks": [{"type": "command", "command": cmd}]}]

with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo "installed Claude Code hooks -> $SETTINGS"

# --- Codex CLI: rewrite the aiorg block in ~/.codex/config.toml ---
mkdir -p "$HOME/.codex"
CODEX_CONFIG="$HOME/.codex/config.toml"
touch "$CODEX_CONFIG"

# Remove any previous aiorg block (between markers) so we can append a fresh one.
"$PY" - "$CODEX_CONFIG" <<'PY'
import sys, re

path = sys.argv[1]
with open(path) as f:
    text = f.read()

text = re.sub(
    r"(?ms)^# >>> aiorg hooks\n.*?^# <<< aiorg hooks\n?",
    "",
    text,
)

with open(path, "w") as f:
    f.write(text)
PY

cat >> "$CODEX_CONFIG" <<EOF
# >>> aiorg hooks
[[hooks]]
event = "session_start"
command = "$CODEX_CMD"

[[hooks]]
event = "stop"
command = "$CODEX_CMD"
# <<< aiorg hooks
EOF

echo "installed Codex CLI hooks -> $CODEX_CONFIG"
echo ""
echo "Next: save your token from the profile page into ~/.config/aiorg/token."
