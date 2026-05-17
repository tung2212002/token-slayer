<?php

use App\Models\Boss;
use App\Models\Event;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['services.slack_notifier.webhook_url' => 'https://hooks.slack.example/T/B/X']);

    // Fire at 09:00 Asia/Ho_Chi_Minh on 2026-05-18 (Monday) so:
    //   daily window  = 2026-05-17 (full day, HCM)
    //   weekly window = 2026-05-11 .. 2026-05-17 (Mon–Sun, HCM)
    CarbonImmutable::setTestNow(CarbonImmutable::create(2026, 5, 18, 2, 0, 0, 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function dailyWindowMoment(): CarbonImmutable
{
    return CarbonImmutable::create(2026, 5, 17, 14, 0, 0, 'Asia/Ho_Chi_Minh');
}

test('daily recap with kills posts shape A to Slack', function () {
    Http::fake();

    $alice = User::factory()->create(['name' => 'Alice', 'slack_handle' => 'alice']);
    $bob = User::factory()->create(['name' => 'Bob', 'slack_handle' => 'bob']);

    $boss = Boss::factory()->defeated()->create([
        'defeated_at' => dailyWindowMoment(),
        'killing_blow_user_id' => $alice->id,
    ]);

    Event::factory()->for($alice)->for($boss)->create([
        'tokens' => 3_200_000,
        'created_at' => dailyWindowMoment(),
    ]);
    Event::factory()->for($bob)->for($boss)->create([
        'tokens' => 2_800_000,
        'created_at' => dailyWindowMoment(),
    ]);

    $this->artisan('battlefield:recap daily')->assertSuccessful();

    Http::assertSent(function ($request) {
        $payload = $request->data();
        $blocks = $payload['blocks'];

        // Shape A: header, summary (2 fields), top fighters, context = 4 blocks
        if (count($blocks) !== 4) {
            return false;
        }

        if (! str_contains($blocks[0]['text']['text'], 'Daily Battlefield Recap')) {
            return false;
        }

        if (count($blocks[1]['fields']) !== 2) {
            return false; // daily must not include active fighters or provider split
        }

        $top = $blocks[2]['text']['text'];

        return str_contains($top, '🥇 @alice — 3.2M')
            && str_contains($top, '🥈 @bob — 2.8M')
            && ! str_contains($top, 'kill'); // daily hides kill counts
    });
});

test('weekly recap with kills posts shape B including provider split and kill counts', function () {
    Http::fake();

    $alice = User::factory()->create(['name' => 'Alice', 'slack_handle' => 'alice']);
    $bob = User::factory()->create(['name' => 'Bob', 'slack_handle' => 'bob']);

    $aliceMoment = CarbonImmutable::create(2026, 5, 12, 10, 0, 0, 'Asia/Ho_Chi_Minh');
    $bobMoment = CarbonImmutable::create(2026, 5, 14, 10, 0, 0, 'Asia/Ho_Chi_Minh');

    $bossA = Boss::factory()->defeated()->create([
        'defeated_at' => $aliceMoment,
        'killing_blow_user_id' => $alice->id,
    ]);
    $bossB = Boss::factory()->defeated()->create([
        'defeated_at' => $bobMoment,
        'killing_blow_user_id' => $bob->id,
    ]);

    Event::factory()->for($alice)->for($bossA)->create([
        'provider' => 'claude-code',
        'tokens' => 18_400_000,
        'created_at' => $aliceMoment,
    ]);
    Event::factory()->for($bob)->for($bossB)->create([
        'provider' => 'codex',
        'tokens' => 15_100_000,
        'created_at' => $bobMoment,
    ]);

    $this->artisan('battlefield:recap weekly')->assertSuccessful();

    Http::assertSent(function ($request) {
        $payload = $request->data();
        $blocks = $payload['blocks'];

        if (! str_contains($blocks[0]['text']['text'], 'Weekly Battlefield Recap')) {
            return false;
        }

        $summaryTexts = array_map(fn ($f) => $f['text'], $blocks[1]['fields']);
        $summaryJoined = implode('|', $summaryTexts);

        if (! str_contains($summaryJoined, 'Active fighters') || ! str_contains($summaryJoined, 'By provider')) {
            return false;
        }

        if (! str_contains($summaryJoined, 'Claude Code 18.4M') || ! str_contains($summaryJoined, 'Codex 15.1M')) {
            return false;
        }

        $top = $blocks[2]['text']['text'];

        return str_contains($top, '🥇 @alice — 18.4M (1 kill)')
            && str_contains($top, '🥈 @bob — 15.1M (1 kill)');
    });
});

test('daily recap with empty window skips the Slack post', function () {
    Http::fake();

    $this->artisan('battlefield:recap daily')->assertSuccessful();

    Http::assertNothingSent();
});

test('weekly recap with empty window still posts a zero-state message', function () {
    Http::fake();

    $this->artisan('battlefield:recap weekly')->assertSuccessful();

    Http::assertSent(function ($request) {
        $payload = $request->data();
        $blocks = $payload['blocks'];

        // No leaderboard section when there are no fighters
        $hasLeaderboard = collect($blocks)->contains(
            fn ($block) => isset($block['text']['text']) && str_contains($block['text']['text'], 'Top fighters'),
        );

        $summaryJoined = implode('|', array_map(fn ($f) => $f['text'], $blocks[1]['fields']));

        return ! $hasLeaderboard
            && str_contains($summaryJoined, '*🐉 Bosses slain*')
            && str_contains($summaryJoined, '0');
    });
});

test('window includes events at start and excludes events at end', function () {
    Http::fake();

    $alice = User::factory()->create(['name' => 'Alice', 'slack_handle' => 'alice']);

    $boss = Boss::factory()->defeated()->create([
        'defeated_at' => dailyWindowMoment(),
        'killing_blow_user_id' => $alice->id,
    ]);

    $atStart = CarbonImmutable::create(2026, 5, 17, 0, 0, 0, 'Asia/Ho_Chi_Minh');     // included
    $atEnd = CarbonImmutable::create(2026, 5, 18, 0, 0, 0, 'Asia/Ho_Chi_Minh');       // excluded
    $beforeStart = CarbonImmutable::create(2026, 5, 16, 23, 59, 59, 'Asia/Ho_Chi_Minh'); // excluded

    Event::factory()->for($alice)->for($boss)->create([
        'tokens' => 1_000_000,
        'created_at' => $atStart,
    ]);
    Event::factory()->for($alice)->for($boss)->create([
        'tokens' => 9_000_000,
        'created_at' => $atEnd,
    ]);
    Event::factory()->for($alice)->for($boss)->create([
        'tokens' => 7_000_000,
        'created_at' => $beforeStart,
    ]);

    $this->artisan('battlefield:recap daily')->assertSuccessful();

    Http::assertSent(function ($request) {
        $top = $request->data()['blocks'][2]['text']['text'];

        return str_contains($top, '🥇 @alice — 1M')
            && ! str_contains($top, '9M')
            && ! str_contains($top, '7M');
    });
});

test('missing webhook URL does not throw and skips posting', function () {
    config(['services.slack_notifier.webhook_url' => null]);
    Http::fake();

    $alice = User::factory()->create(['slack_handle' => 'alice']);
    $boss = Boss::factory()->defeated()->create([
        'defeated_at' => dailyWindowMoment(),
        'killing_blow_user_id' => $alice->id,
    ]);
    Event::factory()->for($alice)->for($boss)->create([
        'tokens' => 1_000_000,
        'created_at' => dailyWindowMoment(),
    ]);

    $this->artisan('battlefield:recap daily')->assertSuccessful();

    Http::assertNothingSent();
});

test('rejects unknown periods', function () {
    $this->artisan('battlefield:recap hourly')
        ->assertFailed();
});
