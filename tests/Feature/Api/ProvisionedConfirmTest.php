<?php

use App\Enums\MembershipStatus;
use App\Models\Account;
use App\Models\AccountUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('flips a pending provisioned membership to tracked and sets claimed_at', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'HOOKTOK')]);
    $account = Account::factory()->create(['organization_uuid' => '11111111-1111-4111-8111-111111111111']);
    $user->accounts()->syncWithoutDetaching([
        $account->id => ['status' => MembershipStatus::Pending->value],
    ]);

    $res = $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', ['accounts' => [['org_uuid' => '11111111-1111-4111-8111-111111111111']]]);

    $res->assertOk()->assertJson(['confirmed' => 1]);

    $pivot = AccountUser::query()
        ->where('user_id', $user->id)->where('account_id', $account->id)->firstOrFail();
    expect($pivot->status)->toBe(MembershipStatus::Tracked)
        ->and($pivot->claimed_at)->not->toBeNull();
});

it('creates the membership as tracked when the user has no existing pivot for the org', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'HOOKTOK')]);
    $account = Account::factory()->create(['organization_uuid' => '22222222-2222-4222-8222-222222222222']);

    expect(AccountUser::query()->where('user_id', $user->id)->where('account_id', $account->id)->exists())
        ->toBeFalse();

    $res = $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', ['accounts' => [['org_uuid' => '22222222-2222-4222-8222-222222222222']]]);

    $res->assertOk()->assertJson(['confirmed' => 1]);

    $pivot = AccountUser::query()
        ->where('user_id', $user->id)->where('account_id', $account->id)->firstOrFail();
    expect($pivot->status)->toBe(MembershipStatus::Tracked)
        ->and($pivot->claimed_at)->not->toBeNull();
});

it('ignores an unknown org uuid without creating an account or erroring', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'HOOKTOK')]);

    $unknownOrgUuid = '99999999-9999-4999-8999-999999999999';
    $res = $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', ['accounts' => [['org_uuid' => $unknownOrgUuid]]]);

    $res->assertOk()->assertJson(['confirmed' => 0]);
    expect(Account::query()->where('organization_uuid', $unknownOrgUuid)->exists())->toBeFalse();
});

it('does not touch a membership on a different account absent from the list (additive only)', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'HOOKTOK')]);
    $confirmedAccount = Account::factory()->create(['organization_uuid' => '33333333-3333-4333-8333-333333333333']);
    $untouchedAccount = Account::factory()->create(['organization_uuid' => '44444444-4444-4444-8444-444444444444']);

    $user->accounts()->syncWithoutDetaching([
        $confirmedAccount->id => ['status' => MembershipStatus::Pending->value],
        $untouchedAccount->id => ['status' => MembershipStatus::Untracked->value],
    ]);

    $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', ['accounts' => [['org_uuid' => '33333333-3333-4333-8333-333333333333']]])
        ->assertOk()->assertJson(['confirmed' => 1]);

    $untouched = AccountUser::query()
        ->where('user_id', $user->id)->where('account_id', $untouchedAccount->id)->firstOrFail();
    expect($untouched->status)->toBe(MembershipStatus::Untracked)
        ->and($untouched->claimed_at)->toBeNull();
});

it('rejects an unauthenticated request with no hook token', function () {
    $this->postJson('/api/provisioned/confirm', ['accounts' => [['org_uuid' => '11111111-1111-4111-8111-111111111111']]])
        ->assertStatus(401);
});

it('rejects a malformed body with a 422', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'HOOKTOK')]);

    $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', ['accounts' => 'not-an-array'])
        ->assertStatus(422);

    $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', ['accounts' => [['org_uuid' => 'not-a-uuid']]])
        ->assertStatus(422);

    $this->withHeader('Authorization', 'Bearer HOOKTOK')
        ->postJson('/api/provisioned/confirm', [])
        ->assertStatus(422);
});
