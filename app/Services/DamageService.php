<?php

namespace App\Services;

use App\Models\Boss;
use App\Models\User;
use App\Support\DamageResult;
use Illuminate\Support\Facades\DB;

class DamageService
{
    public function __construct(private BossArena $arena) {}

    public function apply(User $user, int $tokens): DamageResult
    {
        if ($tokens <= 0) {
            return new DamageResult($this->arena->current());
        }

        return DB::transaction(function () use ($user, $tokens) {
            $boss = Boss::where('status', 'alive')
                ->orderByDesc('number')
                ->lockForUpdate()
                ->first() ?? $this->arena->current();

            $remaining = $tokens;
            $killed = null;

            while ($remaining > 0) {
                if ($boss->current_hp > $remaining) {
                    $boss->current_hp -= $remaining;
                    $boss->save();
                    $remaining = 0;
                    break;
                }
                $remaining -= $boss->current_hp;
                $boss->current_hp = 0;
                $boss->status = 'defeated';
                $boss->defeated_at = now();
                $boss->killing_blow_user_id = $user->id;
                $boss->save();
                $killed = $boss;
                $boss = $this->arena->spawnNext();
            }

            return new DamageResult($boss, $killed);
        });
    }
}
