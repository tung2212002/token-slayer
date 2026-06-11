<?php

test('tracker userscript is publicly accessible as javascript', function () {
    $response = $this->get('/tracker.user.js');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toStartWith('text/javascript');
});

test('tracker userscript carries a valid userscript header targeting claude.ai', function () {
    $script = $this->get('/tracker.user.js')->getContent();

    expect($script)
        ->toContain('// ==UserScript==')
        ->toContain('// ==/UserScript==')
        ->toContain('@match        https://claude.ai/*')
        ->toContain('@grant        GM_xmlhttpRequest')
        ->toContain('@grant        GM_getValue')
        ->toContain('@grant        GM_setValue')
        ->toContain('@connect      '.parse_url(url('/'), PHP_URL_HOST));
});

test('tracker userscript posts stop events to the api with the claude-ai provider', function () {
    $script = $this->get('/tracker.user.js')->getContent();

    expect($script)
        ->toContain(url('/api/events').'?provider=claude-ai')
        ->toContain("hook_event_name: 'Stop'")
        ->toContain("'Authorization': 'Bearer ' + token");
});

test('tracker userscript baselines existing history before dealing damage', function () {
    $script = $this->get('/tracker.user.js')->getContent();

    expect($script)
        ->toContain("GM_getValue('baselined', false)")
        ->toContain('if (!baselining && tokens > 0) report(tokens, conversation.uuid);');
});
