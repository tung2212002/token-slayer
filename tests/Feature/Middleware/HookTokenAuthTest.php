<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

beforeEach(function () {
    Route::middleware('hook.token')->post('/_test/echo', fn () => response()->json([
        'user_id' => request()->user('hook')->id,
    ]));
});

test('missing token returns 401', function () {
    $this->postJson('/_test/echo')->assertStatus(401);
});

test('invalid token returns 401', function () {
    User::factory()->create(['hook_token' => hash('sha256', 'real')]);
    $this->withHeader('Authorization', 'Bearer wrong')->postJson('/_test/echo')->assertStatus(401);
});

test('valid token resolves the user', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'good-token')]);
    $this->withHeader('Authorization', 'Bearer good-token')
        ->postJson('/_test/echo')
        ->assertOk()
        ->assertJson(['user_id' => $user->id]);
});
