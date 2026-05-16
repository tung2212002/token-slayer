<?php

use App\Livewire\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

test('profile shows the plain token once when redirected from oauth', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'plain-abc')]);
    $this->actingAs($user)->withSession(['hook_token_plain' => 'plain-abc']);

    $this->get('/profile')
        ->assertOk()
        ->assertSee('plain-abc')
        ->assertSee($user->slack_handle);
});

test('profile surfaces a curl-pipe-sh installer pointed at the install.sh route', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get('/profile')
        ->assertOk()
        ->assertSee('curl -fsSL')
        ->assertSee(route('install-script'));
});

test('profile shows a combined install command that installs hooks and the token in one shot', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'plain-abc')]);
    $this->actingAs($user)->withSession(['hook_token_plain' => 'plain-abc']);

    $this->get('/profile')
        ->assertOk()
        ->assertSee('curl -fsSL '.route('install-script').' | AIORG_TOKEN=plain-abc sh', escape: false);
});

test('profile hides the token-bearing command when no fresh token is in session', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'plain-abc')]);
    $this->actingAs($user);

    $this->get('/profile')
        ->assertOk()
        ->assertDontSee('AIORG_TOKEN=');
});

test('manual hook config shows a step that writes the token to the config file', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'plain-abc')]);
    $this->actingAs($user)->withSession(['hook_token_plain' => 'plain-abc']);

    $this->get('/profile')
        ->assertOk()
        ->assertSee("printf '%s' 'plain-abc' > ~/.config/aiorg/token")
        ->assertSee('chmod 600 ~/.config/aiorg/token');
});

test('regenerate replaces the hook token', function () {
    $user = User::factory()->create(['hook_token' => hash('sha256', 'old')]);
    $original = $user->hook_token;

    Livewire::actingAs($user)
        ->test(Profile::class)
        ->call('regenerate');

    expect($user->fresh()->hook_token)->not->toBe($original);
});
