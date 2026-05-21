<?php

use App\Models\IdeAccessToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('issueOneTime stores hashed token and binds state', function () {
    $user = User::factory()->create();

    [$plain, $token] = IdeAccessToken::issueOneTime(
        user: $user,
        state: 'abc123',
        ttlSeconds: 120,
    );

    expect($plain)->toBeString()->toHaveLength(64);
    expect($token->kind)->toBe('one_time');
    expect($token->token_hash)->toBe(hash('sha256', $plain));
    expect($token->state_hash)->toBe(hash('sha256', 'abc123'));
    expect($token->expires_at->timestamp)->toBeGreaterThan(now()->timestamp);
});

test('consume returns the user once and never again', function () {
    $user = User::factory()->create();
    [$plain] = IdeAccessToken::issueOneTime($user, 'st', 120);

    expect(IdeAccessToken::consumeOneTime($plain, 'st')?->id)->toBe($user->id);
    expect(IdeAccessToken::consumeOneTime($plain, 'st'))->toBeNull();
});

test('consume rejects mismatched state', function () {
    $user = User::factory()->create();
    [$plain] = IdeAccessToken::issueOneTime($user, 'st', 120);

    expect(IdeAccessToken::consumeOneTime($plain, 'wrong'))->toBeNull();
});

test('consume rejects expired token', function () {
    $user = User::factory()->create();
    [$plain] = IdeAccessToken::issueOneTime($user, 'st', 1);

    $this->travel(2)->seconds();

    expect(IdeAccessToken::consumeOneTime($plain, 'st'))->toBeNull();
});

test('issueBearer creates a long-lived token', function () {
    $user = User::factory()->create();

    [$plain, $token] = IdeAccessToken::issueBearer($user);

    expect($token->kind)->toBe('bearer');
    expect($token->expires_at)->toBeNull();
    expect(IdeAccessToken::resolveBearer($plain)?->id)->toBe($user->id);
});

test('revoke invalidates a bearer', function () {
    $user = User::factory()->create();
    [$plain, $token] = IdeAccessToken::issueBearer($user);

    $token->revoke();

    expect(IdeAccessToken::resolveBearer($plain))->toBeNull();
});

test('resolveBearer updates last_used_at on each call', function () {
    $user = User::factory()->create();
    [$plain, $token] = IdeAccessToken::issueBearer($user);

    expect($token->last_used_at)->toBeNull();

    IdeAccessToken::resolveBearer($plain);

    $touched = $token->fresh();
    expect($touched->last_used_at)->not->toBeNull();
});

test('issueSessionUrl stores the redirect path and is consumable once', function () {
    $user = User::factory()->create();

    [$plain, $token] = IdeAccessToken::issueSessionUrl(
        user: $user,
        redirectPath: '/battlefield?embed=ide',
        ttlSeconds: 30,
    );

    expect($token->kind)->toBe('session_url');
    expect($token->redirect_path)->toBe('/battlefield?embed=ide');

    $first = IdeAccessToken::consumeSessionUrl($plain);
    expect($first)->toMatchArray([
        'user' => $user->is($first['user']) ? $first['user'] : null,
        'redirectPath' => '/battlefield?embed=ide',
    ]);
    expect($first['user']->id)->toBe($user->id);

    expect(IdeAccessToken::consumeSessionUrl($plain))->toBeNull();
});

test('consumeSessionUrl rejects expired tokens', function () {
    $user = User::factory()->create();
    [$plain] = IdeAccessToken::issueSessionUrl($user, '/battlefield', 1);

    $this->travel(2)->seconds();

    expect(IdeAccessToken::consumeSessionUrl($plain))->toBeNull();
});
