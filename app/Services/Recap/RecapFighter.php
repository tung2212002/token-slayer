<?php

namespace App\Services\Recap;

use App\Models\User;

class RecapFighter
{
    public function __construct(
        public readonly ?User $user,
        public readonly int $damage,
        public readonly int $kills,
    ) {}

    public function mention(): string
    {
        if (! $this->user) {
            return 'unknown';
        }

        return $this->user->slack_handle
            ? '@'.$this->user->slack_handle
            : ($this->user->name ?? 'unknown');
    }
}
