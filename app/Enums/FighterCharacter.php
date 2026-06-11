<?php

namespace App\Enums;

/**
 * Playable fighter characters, in assignment order. Values and order must
 * match FIGHTER_TYPES in resources/js/battlefield/config.js; order matters
 * because each user-boss pair is assigned a character via modulo.
 */
enum FighterCharacter: string
{
    case Knight = 'knight';
    case Redhat = 'redhat';
    case NinjaGirl = 'ninjagirl';
    case Adventurer = 'adventurer';
    case Shinobi = 'shinobi';

    public static function forUserAndBoss(int $userId, ?int $bossId): self
    {
        $cases = self::cases();

        return $cases[($userId + (int) $bossId) % count($cases)];
    }
}
