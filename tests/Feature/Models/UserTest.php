<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user factory creates a slack-linked user with a hashed hook token', function () {
    $user = User::factory()->create();

    expect($user->slack_user_id)->not->toBeNull()
        ->and($user->slack_handle)->not->toBeNull()
        ->and($user->avatar_url)->toStartWith('http')
        ->and($user->hook_token)->not->toBeNull() // hashed
        ->and(strlen($user->hook_token))->toBeGreaterThan(40);
});

test('characterForBoss assigns a fighter deterministically from user and boss ids', function () {
    $user = User::factory()->create();
    $keys = ['knight', 'redhat', 'ninjagirl', 'adventurer', 'shinobi'];

    $expected = $keys[($user->id + 7) % 5];

    expect($user->characterForBoss(7))->toBe($expected)
        ->and($user->characterForBoss(7))->toBe($expected)
        ->and($keys)->toContain($user->characterForBoss(null));
});

test('characterForBoss rotates through all five fighters across consecutive bosses', function () {
    $user = User::factory()->create();

    $characters = collect(range(1, 5))
        ->map(fn (int $bossId) => $user->characterForBoss($bossId))
        ->unique();

    expect($characters)->toHaveCount(5);
});
