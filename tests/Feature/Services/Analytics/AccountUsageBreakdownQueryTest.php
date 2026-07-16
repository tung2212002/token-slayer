<?php

use App\Models\Account;
use App\Models\AccountUsageSnapshot;
use App\Models\Event;
use App\Models\User;
use App\Services\Analytics\AccountUsageBreakdownQuery;
use App\Services\Analytics\UsageFilters;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns per-account totals with a full contributor breakdown', function () {
    $account = Account::factory()->create(['email' => 'a@ex.com']);
    $u1 = User::factory()->create(['name' => 'One', 'slack_handle' => null, 'display_name' => null]);
    $u2 = User::factory()->create(['name' => 'Two', 'slack_handle' => null, 'display_name' => null]);
    Event::factory()->for($u1)->create(['account_id' => $account->id, 'tokens' => 300, 'created_at' => now()]);
    Event::factory()->for($u2)->create(['account_id' => $account->id, 'tokens' => 700, 'created_at' => now()]);

    $rows = app(AccountUsageBreakdownQuery::class)->get(UsageFilters::fromPageFilters(['range' => 'all']));

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['account_id'])->toBe($account->id)
        ->and($rows[0]['email'])->toBe('a@ex.com')
        ->and($rows[0]['plan'])->toBe('max-20x')
        ->and($rows[0]['tokens'])->toBe(1000)
        ->and($rows[0]['users'])->toHaveCount(2)
        ->and($rows[0]['users'][0]['tokens'])->toBe(700) // sorted desc
        ->and($rows[0]['users'][0]['handle'])->toBe('Two')
        ->and($rows[0]['users'][1]['tokens'])->toBe(300)
        ->and($rows[0]['users'][1]['handle'])->toBe('One');
});

it('excludes events outside the filtered range', function () {
    $account = Account::factory()->create();
    $user = User::factory()->create();
    Event::factory()->for($user)->create(['account_id' => $account->id, 'tokens' => 500, 'created_at' => now()->subDays(30)]);

    $rows = app(AccountUsageBreakdownQuery::class)->get(
        new UsageFilters(now()->subDays(7), now(), null, null, null)
    );

    expect($rows)->toBeEmpty();
});

it('excludes events with a null account_id', function () {
    $account = Account::factory()->create();
    $user = User::factory()->create();
    Event::factory()->for($user)->create(['account_id' => $account->id, 'tokens' => 400, 'created_at' => now()]);
    Event::factory()->for($user)->create(['account_id' => null, 'tokens' => 999, 'created_at' => now()]);

    $rows = app(AccountUsageBreakdownQuery::class)->get(UsageFilters::fromPageFilters(['range' => 'all']));

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['tokens'])->toBe(400);
});

it('sorts multiple accounts by total tokens descending', function () {
    $user = User::factory()->create();
    $light = Account::factory()->create(['email' => 'light@ex.com']);
    $heavy = Account::factory()->create(['email' => 'heavy@ex.com']);
    Event::factory()->for($user)->create(['account_id' => $light->id, 'tokens' => 100, 'created_at' => now()]);
    Event::factory()->for($user)->create(['account_id' => $heavy->id, 'tokens' => 900, 'created_at' => now()]);

    $rows = app(AccountUsageBreakdownQuery::class)->get(UsageFilters::fromPageFilters(['range' => 'all']));

    expect($rows)->toHaveCount(2)
        ->and($rows[0]['email'])->toBe('heavy@ex.com')
        ->and($rows[1]['email'])->toBe('light@ex.com');
});

it('reads util_5h and util_7d from the account latest usage snapshot, defaulting to null without one', function () {
    $user = User::factory()->create();
    $withSnapshot = Account::factory()->create(['email' => 'snapshot@ex.com']);
    $withoutSnapshot = Account::factory()->create(['email' => 'no-snapshot@ex.com']);
    Event::factory()->for($user)->create(['account_id' => $withSnapshot->id, 'tokens' => 100, 'created_at' => now()]);
    Event::factory()->for($user)->create(['account_id' => $withoutSnapshot->id, 'tokens' => 100, 'created_at' => now()]);
    AccountUsageSnapshot::factory()->for($withSnapshot)->create(['util_5h' => 42, 'util_7d' => 55]);

    $rows = app(AccountUsageBreakdownQuery::class)->get(UsageFilters::fromPageFilters(['range' => 'all']));

    $withSnapshotRow = collect($rows)->firstWhere('email', 'snapshot@ex.com');
    $withoutSnapshotRow = collect($rows)->firstWhere('email', 'no-snapshot@ex.com');

    expect($withSnapshotRow['util_5h'])->toBe(42)
        ->and($withSnapshotRow['util_7d'])->toBe(55)
        ->and($withoutSnapshotRow['util_5h'])->toBeNull()
        ->and($withoutSnapshotRow['util_7d'])->toBeNull();
});
