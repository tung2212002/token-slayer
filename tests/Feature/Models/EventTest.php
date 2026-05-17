<?php

use App\Models\Boss;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('event factory persists provider and tokens', function () {
    $event = Event::factory()->for(User::factory())->for(Boss::factory())->create([
        'provider' => 'claude-code',
        'tokens' => 23_400,
    ]);

    expect($event->provider)->toBe('claude-code')
        ->and($event->tokens)->toBe(23_400);
});
