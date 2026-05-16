<?php

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
        ->toContain('~/.config/aiorg/token')
        ->toContain('Bearer \'\\$(cat ~/.config/aiorg/token)');
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
