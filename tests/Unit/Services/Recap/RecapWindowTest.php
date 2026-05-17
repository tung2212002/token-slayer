<?php

use App\Services\Recap\RecapWindow;
use Carbon\CarbonImmutable;

test('daily window covers the previous calendar day in Asia/Ho_Chi_Minh', function () {
    $now = CarbonImmutable::create(2026, 5, 18, 9, 0, 0, 'Asia/Ho_Chi_Minh');

    $window = RecapWindow::for('daily', $now);

    expect($window->period)->toBe('daily')
        ->and($window->start->toIso8601String())->toBe('2026-05-17T00:00:00+07:00')
        ->and($window->end->toIso8601String())->toBe('2026-05-18T00:00:00+07:00')
        ->and($window->label)->toBe('May 17')
        ->and($window->topN())->toBe(3);
});

test('weekly window covers the previous Monday through Sunday', function () {
    // 2026-05-18 is a Monday — last full week is May 11–17
    $now = CarbonImmutable::create(2026, 5, 18, 9, 0, 0, 'Asia/Ho_Chi_Minh');

    $window = RecapWindow::for('weekly', $now);

    expect($window->start->toIso8601String())->toBe('2026-05-11T00:00:00+07:00')
        ->and($window->end->toIso8601String())->toBe('2026-05-18T00:00:00+07:00')
        ->and($window->label)->toBe('May 11–17')
        ->and($window->topN())->toBe(5);
});

test('weekly label spans months when the previous week crosses a month boundary', function () {
    // 2026-06-01 is a Monday; the previous week is May 25 – May 31
    $now = CarbonImmutable::create(2026, 6, 1, 9, 0, 0, 'Asia/Ho_Chi_Minh');

    $window = RecapWindow::for('weekly', $now);

    expect($window->label)->toBe('May 25–31');
});

test('weekly label uses two month names when the week spans two months', function () {
    // 2026-03-02 is a Monday; previous week is Feb 23 – Mar 1
    $now = CarbonImmutable::create(2026, 3, 2, 9, 0, 0, 'Asia/Ho_Chi_Minh');

    $window = RecapWindow::for('weekly', $now);

    expect($window->label)->toBe('Feb 23–Mar 1');
});

test('monthly window covers the previous calendar month', function () {
    $now = CarbonImmutable::create(2026, 5, 1, 9, 0, 0, 'Asia/Ho_Chi_Minh');

    $window = RecapWindow::for('monthly', $now);

    expect($window->start->toIso8601String())->toBe('2026-04-01T00:00:00+07:00')
        ->and($window->end->toIso8601String())->toBe('2026-05-01T00:00:00+07:00')
        ->and($window->label)->toBe('April 2026')
        ->and($window->topN())->toBe(10);
});

test('yearly window covers the previous calendar year', function () {
    $now = CarbonImmutable::create(2026, 1, 1, 9, 0, 0, 'Asia/Ho_Chi_Minh');

    $window = RecapWindow::for('yearly', $now);

    expect($window->start->toIso8601String())->toBe('2025-01-01T00:00:00+07:00')
        ->and($window->end->toIso8601String())->toBe('2026-01-01T00:00:00+07:00')
        ->and($window->label)->toBe('2025')
        ->and($window->topN())->toBe(10);
});

test('localizes now from another timezone before computing window', function () {
    // 2026-05-18 00:30 UTC = 2026-05-18 07:30 +07 — still day of May 18 in HCM
    $nowUtc = CarbonImmutable::create(2026, 5, 18, 0, 30, 0, 'UTC');

    $window = RecapWindow::for('daily', $nowUtc);

    expect($window->label)->toBe('May 17');
});

test('rejects unknown periods', function () {
    RecapWindow::for('hourly');
})->throws(InvalidArgumentException::class);

test('exposes a cadence-specific title', function (string $period, string $expectedPrefix) {
    $now = CarbonImmutable::create(2026, 5, 18, 9, 0, 0, 'Asia/Ho_Chi_Minh');
    $window = RecapWindow::for($period, $now);

    expect($window->title())->toStartWith($expectedPrefix);
})->with([
    ['daily', '☀️ Daily Battlefield Recap'],
    ['weekly', '📅 Weekly Battlefield Recap'],
    ['monthly', '📆 Monthly Battlefield Recap'],
    ['yearly', '🏆 Yearly Battlefield Recap'],
]);
