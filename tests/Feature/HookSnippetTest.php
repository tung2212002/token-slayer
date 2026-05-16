<?php

test('claude snippet reads token from file and includes all event hooks', function () {
    $rendered = view('partials.claude-snippet', [
        'baseUrl' => 'https://app/api/events',
    ])->render();

    foreach (['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop', 'SubagentStop', 'SessionEnd', 'Notification'] as $hook) {
        expect($rendered)->toContain($hook);
    }
    expect($rendered)
        ->toContain("Bearer '\$(cat ~/.config/aiorg/token)")
        ->toContain('https://app/api/events');

    expect(json_decode($rendered, true))->toBeArray();
});

test('claude snippet suppresses curl errors so unreachable endpoints stay silent', function () {
    $rendered = view('partials.claude-snippet', [
        'baseUrl' => 'https://app/api/events',
    ])->render();

    expect($rendered)
        ->toContain('curl -s ')
        ->not->toContain('curl -sS')
        ->toContain('>/dev/null 2>&1');
});

test('codex snippet reads token from file and includes a curl command', function () {
    $rendered = view('partials.codex-snippet', [
        'baseUrl' => 'https://app/api/events?provider=codex',
    ])->render();

    expect($rendered)
        ->toContain("Bearer '\$(cat ~/.config/aiorg/token)")
        ->toContain('https://app/api/events?provider=codex')
        ->toContain('curl');
});

test('codex snippet suppresses curl errors so unreachable endpoints stay silent', function () {
    $rendered = view('partials.codex-snippet', [
        'baseUrl' => 'https://app/api/events?provider=codex',
    ])->render();

    expect($rendered)
        ->toContain('curl -s ')
        ->not->toContain('curl -sS')
        ->toContain('>/dev/null 2>&1');
});
