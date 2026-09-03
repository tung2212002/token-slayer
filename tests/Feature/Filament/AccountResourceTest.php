<?php

use App\Enums\CodexPlan;
use App\Filament\Resources\Accounts\Pages\ListAccounts;
use App\Models\Account;
use App\Models\CodexCredential;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Livewire\Livewire;

uses(RefreshDatabase::class);

it('the index table renders a provider column with the correct value per row', function (): void {
    $admin = User::factory()->admin()->create();
    $claude = Account::factory()->create(['provider' => 'claude', 'email' => 'claude@example.com']);
    $codex = Account::factory()->create(['provider' => 'codex', 'email' => 'codex@example.com']);
    CodexCredential::factory()->for($codex)->create();

    Livewire::actingAs($admin)
        ->test(ListAccounts::class)
        ->assertTableColumnStateSet('provider', 'claude', record: $claude)
        ->assertTableColumnStateSet('provider', 'codex', record: $codex);
});

it('the plan column renders the CodexPlan badge for a Codex row', function (): void {
    $admin = User::factory()->admin()->create();
    $codex = Account::factory()->create(['provider' => 'codex']);
    CodexCredential::factory()->for($codex)->create(['plan_type' => 'pro']);

    Livewire::actingAs($admin)
        ->test(ListAccounts::class)
        ->assertTableColumnStateSet('plan', CodexPlan::Pro, record: $codex);
});

it('Refresh now is not shown on a Codex row (no CodexUsageProber exists yet)', function (): void {
    $admin = User::factory()->admin()->create();
    $codex = Account::factory()->create(['provider' => 'codex']);
    CodexCredential::factory()->for($codex)->create();

    Livewire::actingAs($admin)
        ->test(ListAccounts::class)
        ->assertTableActionHidden('refreshNow', $codex);
});

it('Disconnect on a Codex row calls CodexConnectService, not AccountConnectService', function (): void {
    $admin = User::factory()->admin()->create();
    $codex = Account::factory()->create(['provider' => 'codex']);
    CodexCredential::factory()->for($codex)->create(['codex_access_token' => 'fake-token', 'codex_refresh_token' => 'refresh-1']);
    Http::fake(['auth.openai.com/oauth/revoke' => Http::response([], 200)]);

    Livewire::actingAs($admin)
        ->test(ListAccounts::class)
        ->callTableAction('disconnect', $codex);

    expect($codex->fresh()->codexCredential->codex_access_token)->toBeNull();
});
