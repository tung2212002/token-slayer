<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
});

test('proxies a slack avatar with CORS-friendly headers', function () {
    Http::fake([
        'avatars.slack-edge.com/*' => Http::response('FAKE_JPEG_BYTES', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $user = User::factory()->create([
        'avatar_url' => 'https://avatars.slack-edge.com/example.jpg',
    ]);

    $response = $this->get(route('avatar', $user));

    $response->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg')
        ->assertHeader('Access-Control-Allow-Origin', '*')
        ->assertHeader('Cache-Control', 'max-age=86400, public');

    expect($response->getContent())->toBe('FAKE_JPEG_BYTES');
});

test('caches the upstream response so the second request does not refetch', function () {
    Http::fake([
        'avatars.slack-edge.com/*' => Http::response('FAKE_JPEG_BYTES', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $user = User::factory()->create([
        'avatar_url' => 'https://avatars.slack-edge.com/example.jpg',
    ]);

    $this->get(route('avatar', $user))->assertOk();
    $this->get(route('avatar', $user))->assertOk();

    Http::assertSentCount(1);
});

test('returns 404 when the user has no avatar url', function () {
    $user = User::factory()->create(['avatar_url' => null]);

    $this->get(route('avatar', $user))->assertNotFound();
});

test('returns 404 when the upstream fetch fails', function () {
    Http::fake([
        'avatars.slack-edge.com/*' => Http::response('not found', 404),
    ]);

    $user = User::factory()->create([
        'avatar_url' => 'https://avatars.slack-edge.com/missing.jpg',
    ]);

    $this->get(route('avatar', $user))->assertNotFound();
});
