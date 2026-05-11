<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boss;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StateController extends Controller
{
    public function show(): JsonResponse
    {
        $boss = Boss::where('status', 'alive')->orderByDesc('number')->first();
        $cutoff = now()->subMinutes(config('game.idle_minutes'));

        $fighters = User::where('last_event_at', '>=', $cutoff)
            ->orderByDesc('last_event_at')
            ->get(['id', 'slack_handle', 'display_name', 'avatar_url', 'last_event_at']);

        $log = Event::with('user:id,slack_handle')
            ->where('event_type', 'stop')
            ->whereNotNull('tokens')
            ->latest('id')
            ->limit(10)
            ->get(['id', 'user_id', 'tokens', 'created_at']);

        return response()->json([
            'boss' => $boss,
            'fighters' => $fighters,
            'log' => $log,
        ]);
    }
}
