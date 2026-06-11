<?php

use App\Enums\FighterCharacter;

test('fighter characters match the battlefield JS config keys in assignment order', function () {
    // Values and order must match FIGHTER_TYPES in resources/js/battlefield/config.js;
    // order matters because character assignment is (user_id + boss_id) % count.
    expect(array_column(FighterCharacter::cases(), 'value'))
        ->toBe(['knight', 'redhat', 'ninjagirl', 'adventurer', 'shinobi']);
});

test('forUserAndBoss assigns characters deterministically and rotates per boss', function () {
    expect(FighterCharacter::forUserAndBoss(3, 7))->toBe(FighterCharacter::cases()[(3 + 7) % 5])
        ->and(FighterCharacter::forUserAndBoss(3, 7))->toBe(FighterCharacter::forUserAndBoss(3, 7))
        ->and(FighterCharacter::forUserAndBoss(3, null))->toBe(FighterCharacter::cases()[3 % 5]);
});
