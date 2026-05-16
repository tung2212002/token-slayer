<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guest sees only a slack login button on the homepage', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee(route('slack.login'), false)
        ->assertSee('Sign in with Slack');
});

test('authenticated user is redirected to the battlefield', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/')
        ->assertRedirect(route('battlefield'));
});
