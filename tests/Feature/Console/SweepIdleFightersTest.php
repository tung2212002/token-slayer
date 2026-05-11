<?php

use App\Events\FighterIdled;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

test('sweep marks users past idle window and broadcasts FighterIdled', function () {
    Event::fake([FighterIdled::class]);

    $stale = User::factory()->create(['last_event_at' => now()->subMinutes(45)]);
    $fresh = User::factory()->create(['last_event_at' => now()->subMinutes(5)]);

    $this->artisan('fighters:sweep-idle')->assertSuccessful();

    Event::assertDispatched(FighterIdled::class, fn ($e) => $e->user->id === $stale->id);
    Event::assertNotDispatched(FighterIdled::class, fn ($e) => $e->user->id === $fresh->id);
});
