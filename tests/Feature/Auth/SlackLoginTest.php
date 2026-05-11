<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;

uses(RefreshDatabase::class);

test('slack callback creates user, generates hook token, logs in', function () {
    $slackUser = Mockery::mock(Laravel\Socialite\Two\User::class);
    $slackUser->shouldReceive('getId')->andReturn('U123');
    $slackUser->shouldReceive('getName')->andReturn('Alice Liu');
    $slackUser->shouldReceive('getNickname')->andReturn('alice');
    $slackUser->shouldReceive('getEmail')->andReturn('alice@example.com');
    $slackUser->shouldReceive('getAvatar')->andReturn('https://avatar/alice.png');

    $provider = Mockery::mock(AbstractProvider::class);
    $provider->shouldReceive('user')->andReturn($slackUser);
    Socialite::shouldReceive('driver')->with('slack')->andReturn($provider);

    $this->get('/auth/slack/callback')->assertRedirect('/profile');

    $user = User::sole();
    expect($user->slack_user_id)->toBe('U123')
        ->and($user->slack_handle)->toBe('alice')
        ->and($user->avatar_url)->toBe('https://avatar/alice.png')
        ->and($user->hook_token)->not->toBeNull()
        ->and(auth()->id())->toBe($user->id);

    expect(session('hook_token_plain'))->not->toBeNull();
});
