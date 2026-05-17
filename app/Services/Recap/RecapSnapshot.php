<?php

namespace App\Services\Recap;

use Illuminate\Support\Collection;

class RecapSnapshot
{
    /**
     * @param  Collection<int, RecapFighter>  $leaderboard  ordered desc by damage
     * @param  array<string, int>  $providerSplit  provider => damage
     */
    public function __construct(
        public readonly RecapWindow $window,
        public readonly int $bossesSlain,
        public readonly int $totalDamage,
        public readonly int $activeFighters,
        public readonly Collection $leaderboard,
        public readonly array $providerSplit,
    ) {}

    public function isEmpty(): bool
    {
        return $this->bossesSlain === 0 && $this->totalDamage === 0;
    }
}
