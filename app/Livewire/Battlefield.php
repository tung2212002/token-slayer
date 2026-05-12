<?php

namespace App\Livewire;

use App\Models\Boss;
use App\Models\User;
use App\Services\BossArena;
use Livewire\Component;

class Battlefield extends Component
{
    public Boss $boss;

    public $fighters = [];

    public function mount(BossArena $arena): void
    {
        $this->boss = $arena->current();
        $this->fighters = User::where('last_event_at', '>=', now()->subMinutes(config('game.idle_minutes')))
            ->get();
    }

    public function render()
    {
        return view('livewire.battlefield');
    }
}
