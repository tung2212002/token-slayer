<?php

beforeEach(fn () => config(['app.hook_namespace' => 'aiorg']));

test('install.sh is publicly accessible as a shell script', function () {
    $response = $this->get('/install');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toStartWith('text/x-shellscript');
});

test('install.sh embeds the events URL and points the hook command at the local token file', function () {
    $script = $this->get('/install')->getContent();

    expect($script)
        ->toContain('#!/bin/sh')
        ->toContain(url('/api/events'))
        ->toContain('TOKEN_FILE="$HOME/.config/aiorg/token"')
        ->toContain('Bearer $(cat "$TOKEN_FILE")');
});

test('install.sh drops a hook helper script that enriches Stop events with transcript tokens', function () {
    $script = $this->get('/install')->getContent();

    expect($script)
        ->toContain('HELPER="$HOME/.config/aiorg/send-hook.sh"')
        ->toContain("cat > \"\$HELPER\" <<'HOOK_SH'")
        ->toContain('chmod +x "$HELPER"')
        ->toContain('transcript_path')
        ->toContain('output_tokens')
        ->toContain('CLAUDE_CMD="bash $HELPER"')
        ->toContain('CODEX_CMD="PROVIDER=codex bash $HELPER"');
});

test('install.sh covers every claude code hook event', function () {
    $script = $this->get('/install')->getContent();

    foreach (['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop', 'SubagentStop', 'SessionEnd', 'Notification'] as $event) {
        expect($script)->toContain($event);
    }
});

test('install.sh writes to claude settings and codex config and uses idempotent markers', function () {
    $script = $this->get('/install')->getContent();

    expect($script)
        ->toContain('$HOME/.claude/settings.json')
        ->toContain('$HOME/.codex/config.toml')
        ->toContain('# >>> aiorg hooks')
        ->toContain('# <<< aiorg hooks');
});

test('install.sh saves AIORG_TOKEN to the token file when present', function () {
    $script = $this->get('/install')->getContent();

    expect($script)
        ->toContain('${AIORG_TOKEN:-}')
        ->toContain('printf \'%s\' "$AIORG_TOKEN"')
        ->toContain('chmod 600 "$TOKEN_FILE"');
});

test('install.sh uses the configured hook namespace in paths, env var, and markers', function () {
    config(['app.hook_namespace' => 'acme']);

    $script = $this->get('/install')->getContent();

    expect($script)
        ->toContain('~/.config/acme/token')
        ->toContain('${ACME_TOKEN:-}')
        ->toContain('# >>> acme hooks')
        ->toContain('# <<< acme hooks')
        ->not->toContain('aiorg')
        ->not->toContain('AIORG_TOKEN');
});
