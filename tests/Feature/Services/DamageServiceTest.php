<?php

use App\Models\Boss;
use App\Models\User;
use App\Services\DamageService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(fn () => $this->damage = app(DamageService::class));

test('damage reduces current boss HP without killing when boss survives', function () {
    $boss = Boss::factory()->create(['number' => 1, 'max_hp' => 1_000_000, 'current_hp' => 1_000_000]);
    $user = User::factory()->create();

    $result = $this->damage->apply($user, tokens: 250_000);

    expect($result->killedBoss)->toBeNull()
        ->and($result->boss->id)->toBe($boss->id)
        ->and($result->boss->current_hp)->toBe(750_000);
});

test('damage that exceeds HP kills the boss and carries overflow to the next', function () {
    Boss::factory()->create(['number' => 1, 'max_hp' => 100, 'current_hp' => 100]);
    $user = User::factory()->create();

    $result = $this->damage->apply($user, tokens: 350);

    expect($result->killedBoss->number)->toBe(1)
        ->and($result->killedBoss->status)->toBe('defeated')
        ->and($result->killedBoss->killing_blow_user_id)->toBe($user->id)
        ->and($result->boss->number)->toBe(2)
        ->and($result->boss->current_hp)->toBe($result->boss->max_hp - 250);
});

test('zero-token damage is a no-op', function () {
    Boss::factory()->create(['number' => 1, 'max_hp' => 1_000, 'current_hp' => 1_000]);
    $user = User::factory()->create();

    $result = $this->damage->apply($user, tokens: 0);

    expect($result->killedBoss)->toBeNull()
        ->and($result->boss->current_hp)->toBe(1_000);
});
