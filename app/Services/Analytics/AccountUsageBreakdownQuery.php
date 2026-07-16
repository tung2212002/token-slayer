<?php

namespace App\Services\Analytics;

use App\Services\Analytics\Concerns\ScopesEventsByFilters;

/**
 * Per-account token usage within the filtered range, each account broken down
 * by contributing user (any membership status). Feeds the account-usage
 * breakdown widget on the Usage Analytics page.
 */
final class AccountUsageBreakdownQuery
{
    use ScopesEventsByFilters;

    /**
     * Build the account rows: total tokens in range, latest 5h/7d utilization
     * (from {@see QuotaGaugesQuery}), and each contributor's token total
     * (desc). Accounts with no events in range are omitted. One grouped query
     * feeds the fold below, so this never queries per account or per user.
     *
     * @param  UsageFilters  $filters  the shared analytics filter
     * @return array<int, array{account_id:int, email:string, plan:?string, tokens:int, util_5h:?int, util_7d:?int, users:array<int, array{user_id:int, handle:string, avatar_url:?string, tokens:int}>}>
     */
    public function get(UsageFilters $filters): array
    {
        $rows = $this->scopeEvents($filters)
            ->join('users', 'users.id', '=', 'events.user_id')
            ->leftJoin('accounts', 'accounts.id', '=', 'events.account_id')
            ->whereNotNull('events.account_id')
            ->groupBy('events.account_id', 'accounts.email', 'accounts.plan', 'users.id', 'users.slack_handle', 'users.display_name', 'users.name', 'users.avatar_url')
            ->selectRaw('events.account_id as account_id, accounts.email as email, accounts.plan as plan')
            ->selectRaw('users.id as user_id, users.slack_handle, users.display_name, users.name, users.avatar_url')
            ->selectRaw('SUM(events.tokens) as tokens')
            ->orderByRaw('SUM(events.tokens) DESC')
            ->get();

        $gauges = collect(app(QuotaGaugesQuery::class)->get())->keyBy('account_id');

        $byAccount = [];

        foreach ($rows as $row) {
            $accountId = (int) $row->account_id;

            if (! isset($byAccount[$accountId])) {
                $byAccount[$accountId] = [
                    'account_id' => $accountId,
                    'email' => (string) $row->email,
                    'plan' => $row->plan,
                    'tokens' => 0,
                    'util_5h' => $gauges[$accountId]['util_5h'] ?? null,
                    'util_7d' => $gauges[$accountId]['util_7d'] ?? null,
                    'users' => [],
                ];
            }

            $userTokens = (int) $row->tokens;
            $byAccount[$accountId]['tokens'] += $userTokens;
            $byAccount[$accountId]['users'][] = [
                'user_id' => (int) $row->user_id,
                'handle' => $row->slack_handle ?: ($row->display_name ?: ($row->name ?: ('#'.$row->user_id))),
                'avatar_url' => $row->avatar_url,
                'tokens' => $userTokens,
            ];
        }

        usort($byAccount, fn (array $a, array $b): int => $b['tokens'] <=> $a['tokens']);

        return array_values($byAccount);
    }
}
