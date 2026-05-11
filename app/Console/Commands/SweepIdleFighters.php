<?php

namespace App\Console\Commands;

use App\Events\FighterIdled;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('fighters:sweep-idle')]
#[Description('Mark fighters idle when their last event is outside the idle window')]
class SweepIdleFighters extends Command
{
    public function handle(): int
    {
        $cutoff = now()->subMinutes(config('game.idle_minutes'));

        User::where('last_event_at', '<', $cutoff)
            ->whereNotNull('last_event_at')
            ->chunkById(100, function ($users) {
                foreach ($users as $user) {
                    event(new FighterIdled($user));
                }
            });

        return self::SUCCESS;
    }
}
