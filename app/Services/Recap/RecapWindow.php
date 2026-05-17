<?php

namespace App\Services\Recap;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use InvalidArgumentException;

class RecapWindow
{
    public const TIMEZONE = 'Asia/Ho_Chi_Minh';

    public const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

    public function __construct(
        public readonly string $period,
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
        public readonly string $label,
    ) {}

    public static function for(string $period, ?CarbonImmutable $now = null): self
    {
        if (! in_array($period, self::PERIODS, true)) {
            throw new InvalidArgumentException("Unknown recap period: {$period}");
        }

        $now = ($now ?? CarbonImmutable::now())->setTimezone(self::TIMEZONE);

        return match ($period) {
            'daily' => self::daily($now),
            'weekly' => self::weekly($now),
            'monthly' => self::monthly($now),
            'yearly' => self::yearly($now),
        };
    }

    private static function daily(CarbonImmutable $now): self
    {
        $end = $now->startOfDay();
        $start = $end->subDay();

        return new self('daily', $start, $end, $start->format('M j'));
    }

    private static function weekly(CarbonImmutable $now): self
    {
        $end = $now->startOfWeek(Carbon::MONDAY);
        $start = $end->subWeek();
        $last = $end->subDay();

        $label = $start->format('M') === $last->format('M')
            ? sprintf('%s–%d', $start->format('M j'), $last->day)
            : sprintf('%s–%s', $start->format('M j'), $last->format('M j'));

        return new self('weekly', $start, $end, $label);
    }

    private static function monthly(CarbonImmutable $now): self
    {
        $end = $now->startOfMonth();
        $start = $end->subMonth();

        return new self('monthly', $start, $end, $start->format('F Y'));
    }

    private static function yearly(CarbonImmutable $now): self
    {
        $end = $now->startOfYear();
        $start = $end->subYear();

        return new self('yearly', $start, $end, $start->format('Y'));
    }

    public function topN(): int
    {
        return match ($this->period) {
            'daily' => 3,
            'weekly' => 5,
            'monthly', 'yearly' => 10,
        };
    }

    public function isDaily(): bool
    {
        return $this->period === 'daily';
    }

    public function title(): string
    {
        return match ($this->period) {
            'daily' => sprintf('☀️ Daily Battlefield Recap — %s', $this->label),
            'weekly' => sprintf('📅 Weekly Battlefield Recap — %s', $this->label),
            'monthly' => sprintf('📆 Monthly Battlefield Recap — %s', $this->label),
            'yearly' => sprintf('🏆 Yearly Battlefield Recap — %s', $this->label),
        };
    }
}
