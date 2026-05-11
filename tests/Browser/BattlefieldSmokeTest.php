<?php

use App\Models\Boss;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('battlefield page loads with no JS errors', function () {
    // Skip if no Chromium / Chrome is available — Pest 4 browser tests need it.
    $hasChrome = (bool) shell_exec('command -v chromium chromium-browser google-chrome chrome 2>/dev/null');

    if (! $hasChrome) {
        $this->markTestSkipped('No Chromium/Chrome installed — browser environment unavailable.');
    }

    Boss::factory()->create(['number' => 1, 'max_hp' => 1_000, 'current_hp' => 1_000]);

    $page = visit('/battlefield');

    $page->assertSee('Boss #1')
        ->assertNoJavaScriptErrors();
});
