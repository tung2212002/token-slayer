<?php

use App\Filament\Widgets\TokenVolumeChart;
use App\Filament\Widgets\TopAccountsLeaderboard;
use App\Filament\Widgets\TopUsersLeaderboard;
use App\Models\Account;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

test('the token volume chart renders with data for the default range', function () {
    $user = User::factory()->create();
    Event::factory()->for($user)->create(['provider' => 'claude-code', 'tokens' => 500, 'created_at' => now()->subDay()]);

    Livewire::test(TokenVolumeChart::class, ['filters' => ['range' => '7d']])
        ->assertOk();
});

test('the top users leaderboard renders', function () {
    $user = User::factory()->create(['slack_handle' => 'ada']);
    Event::factory()->for($user)->create(['tokens' => 500, 'created_at' => now()->subDay()]);

    Livewire::test(TopUsersLeaderboard::class, ['filters' => ['range' => '7d']])->assertOk();
});

test('the top accounts leaderboard renders', function () {
    $user = User::factory()->create();
    $account = Account::factory()->create();
    Event::factory()->for($user)->create(['account_id' => $account->id, 'tokens' => 500, 'created_at' => now()->subDay()]);

    Livewire::test(TopAccountsLeaderboard::class, ['filters' => ['range' => '7d']])->assertOk();
});
