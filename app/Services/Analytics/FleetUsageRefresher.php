<?php

namespace App\Services\Analytics;

use App\Models\Account;
use App\Services\CodexUsageProber;
use App\Services\DamageTotals;
use App\Services\UsageProber;
use Illuminate\Support\Facades\Cache;

/**
 * Re-probes every probeable org account's current usage on demand (the
 * Fleet-quota widget's Refresh button) and busts the cached damage totals so
 * the analytics widgets recompute from the fresh snapshots. Each probe is
 * isolated: one account's failure never aborts the sweep. Fans out over both
 * providers — Claude via {@see UsageProber}, Codex via
 * {@see CodexUsageProber}.
 */
final class FleetUsageRefresher
{
    /**
     * Build the refresher with the per-provider probers it fans out over.
     *
     * @param  UsageProber  $prober  the per-account Claude usage prober
     * @param  CodexUsageProber  $codexProber  the per-account Codex usage prober
     * @return void
     */
    public function __construct(
        private readonly UsageProber $prober,
        private readonly CodexUsageProber $codexProber,
    ) {}

    /**
     * Probe every probeable account of either provider, forget the
     * damage-totals cache, and return how many accounts were attempted.
     *
     * @return int the number of accounts probed
     */
    public function refresh(): int
    {
        $accounts = Account::probeable()->get()->merge(Account::codexProbeable()->get());

        foreach ($accounts as $account) {
            try {
                $account->provider === 'codex'
                    ? $this->codexProber->probe($account)
                    : $this->prober->probe($account);
            } catch (\Throwable) {
                // A single account's failure must not abort the fleet sweep;
                // the prober already records a safe probe_error per account.
            }
        }

        Cache::forget(DamageTotals::CACHE_KEY);

        return $accounts->count();
    }
}
