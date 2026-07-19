<?php

use App\Enums\AccountStatus;
use App\Models\Account;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

test('anchors only probeable accounts, one message each', function () {
    fakeAnthropic();

    $probeable = Account::factory()->connected()->create(['oauth_expires_at' => now()->addHours(8)]);
    Account::factory()->connected()->create(['status' => AccountStatus::Disabled]);
    Account::factory()->needsReauth()->create();
    Account::factory()->create(['oauth_refresh_token' => null]);

    $this->artisan('accounts:anchor-sessions')->assertSuccessful();

    Http::assertSentCount(1);
    Http::assertSent(fn (Request $request) => $request->url() === config('token_slayer.anthropic.messages_endpoint')
        && $request->hasHeader('Authorization', 'Bearer '.$probeable->oauth_access_token)
    );
});

test('reports a summary line with the anchored count', function () {
    fakeAnthropic();
    Account::factory()->connected()->create(['oauth_expires_at' => now()->addHours(8)]);
    Account::factory()->connected()->create(['oauth_expires_at' => now()->addHours(8)]);

    $this->artisan('accounts:anchor-sessions')
        ->expectsOutputToContain('anchored 2 of 2 accounts')
        ->assertSuccessful();
});

test('a failed anchor does not abort the batch', function () {
    fakeAnthropic(['messages' => Http::response('', 500)]);
    Account::factory()->connected()->create(['oauth_expires_at' => now()->addHours(8)]);
    Account::factory()->connected()->create(['oauth_expires_at' => now()->addHours(8)]);

    $this->artisan('accounts:anchor-sessions')
        ->expectsOutputToContain('anchored 0 of 2 accounts')
        ->assertSuccessful();
});
