<?php

use App\Filament\Widgets\AccountUsageBreakdown;
use App\Models\Account;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

it('renders an account row with its contributor and token total', function () {
    $account = Account::factory()->create(['email' => 'team@ex.com']);
    $user = User::factory()->create(['name' => 'Contributor', 'slack_handle' => null, 'display_name' => null]);
    Event::factory()->for($user)->create(['account_id' => $account->id, 'tokens' => 4200, 'created_at' => now()]);

    Livewire::test(AccountUsageBreakdown::class, ['pageFilters' => ['range' => 'all']])
        ->assertSee('team@ex.com')
        ->assertSee('Contributor')
        ->assertSee('4,200');
});
