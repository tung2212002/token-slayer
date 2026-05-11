<?php

namespace App\Http\Controllers\Api;

use App\Events\BossKilled;
use App\Events\BossSpawned;
use App\Events\FighterCharging;
use App\Events\FighterJoined;
use App\Events\HitDealt;
use App\Http\Controllers\Controller;
use App\Models\Boss;
use App\Models\Event;
use App\Services\DamageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function __construct(private DamageService $damage) {}

    public function store(Request $request): JsonResponse
    {
        $user = $request->user('hook');
        $payload = $request->all();

        $hookName = $payload['hook_event_name'] ?? 'unknown';
        $eventType = $this->normalizeEventType($hookName);
        $provider = $request->query('provider', 'claude-code');
        $tokens = $eventType === 'stop' ? (int) ($payload['tokens'] ?? 0) : null;

        $boss = Boss::where('status', 'alive')->orderByDesc('number')->first();

        Event::create([
            'user_id' => $user->id,
            'boss_id' => $boss?->id,
            'provider' => $provider,
            'event_type' => $eventType,
            'tokens' => $tokens,
            'session_id' => $payload['session_id'] ?? null,
            'raw_payload' => $payload,
        ]);

        $user->forceFill(['last_event_at' => now()])->save();

        if ($eventType === 'user-prompt-submit') {
            event(new FighterCharging($user));
        }

        if ($eventType === 'session-start') {
            event(new FighterJoined($user));
        }

        if ($eventType === 'stop' && $tokens > 0) {
            $result = $this->damage->apply($user, $tokens);

            foreach ($result->killedBosses as $killed) {
                event(new BossKilled($killed, $user));
            }

            if (! empty($result->killedBosses)) {
                event(new BossSpawned($result->boss));
            }

            event(new HitDealt($user, $tokens, $result->boss));
        }

        return response()->json(['ok' => true], 201);
    }

    private function normalizeEventType(string $hookName): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $hookName));
    }
}
