<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user factory creates a slack-linked user with a hashed hook token', function () {
    $user = User::factory()->create();

    expect($user->slack_user_id)->not->toBeNull()
        ->and($user->slack_handle)->not->toBeNull()
        ->and($user->avatar_url)->toStartWith('http')
        ->and($user->hook_token)->not->toBeNull() // hashed
        ->and(strlen($user->hook_token))->toBeGreaterThan(40);
});
