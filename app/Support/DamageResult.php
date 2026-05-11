<?php

namespace App\Support;

use App\Models\Boss;

class DamageResult
{
    public function __construct(public Boss $boss, public ?Boss $killedBoss = null) {}
}
