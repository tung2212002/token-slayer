<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guest sees a slack login link on the homepage', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee(route('slack.login'), false)
        ->assertSee('Log in with Slack');
});

test('authenticated user sees a link into the battlefield on the homepage', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/')
        ->assertOk()
        ->assertSee(route('battlefield'), false)
        ->assertSee('Enter Battlefield');
});
