<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin usage route redirects guests to slack login', function () {
    $this->get('/admin/usage')->assertRedirect(route('slack.login'));
});

test('non-admin users are forbidden from the admin usage page', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]));

    $this->get('/admin/usage')->assertForbidden();
});

test('admin users can view the admin usage page', function () {
    $this->actingAs(User::factory()->create(['is_admin' => true]));

    $this->get('/admin/usage')
        ->assertOk()
        ->assertSee('Usage by account')
        ->assertSee('Usage by user');
});
