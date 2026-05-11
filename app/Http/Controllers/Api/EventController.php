<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boss;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user('hook');
        $payload = $request->all();

        $hookName = $payload['hook_event_name'] ?? 'unknown';
        $eventType = $this->normalizeEventType($hookName);
        $provider = $request->query('provider', 'claude-code');

        $boss = Boss::where('status', 'alive')->orderByDesc('number')->first();

        Event::create([
            'user_id' => $user->id,
            'boss_id' => $boss?->id,
            'provider' => $provider,
            'event_type' => $eventType,
            'tokens' => null,
            'session_id' => $payload['session_id'] ?? null,
            'raw_payload' => $payload,
        ]);

        $user->forceFill(['last_event_at' => now()])->save();

        return response()->json(['ok' => true], 201);
    }

    private function normalizeEventType(string $hookName): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $hookName));
    }
}
