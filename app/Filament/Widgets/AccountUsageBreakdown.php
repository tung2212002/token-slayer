<?php

namespace App\Filament\Widgets;

use App\Services\Analytics\AccountUsageBreakdownQuery;
use App\Services\Analytics\UsageFilters;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\Widget;

/**
 * Blade widget listing each account's token usage in the filtered range with a
 * per-user contributor breakdown (usage left, users right). Inline-styled
 * because the admin panel has no custom Tailwind theme.
 */
class AccountUsageBreakdown extends Widget
{
    use InteractsWithPageFilters;

    /**
     * The Blade view rendering the account cards.
     *
     * @var string
     */
    protected string $view = 'filament.widgets.account-usage-breakdown';

    /**
     * How many of the page's columns this widget spans (full-width).
     *
     * @var int|string|array<string, int|string|null>
     */
    protected int|string|array $columnSpan = 'full';

    /**
     * Provide the per-account breakdown rows to the view.
     *
     * @return array<string, mixed>
     */
    protected function getViewData(): array
    {
        $filters = UsageFilters::fromPageFilters($this->pageFilters ?? []);

        return ['rows' => app(AccountUsageBreakdownQuery::class)->get($filters)];
    }
}
