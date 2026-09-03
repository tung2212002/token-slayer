<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Services\CodexUsageProber;
use App\Services\UsageProber;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Runs the 5-minute quota-utilization prober across every probeable org
 * account, of either provider. {@see UsageProber::probe} /
 * {@see CodexUsageProber::probe} already handle expected failures (dead
 * token, transient HTTP errors) by returning null; the try/catch here is a
 * safety net against an unanticipated exception in a single account so it
 * cannot abort the rest of the batch.
 */
#[Signature('accounts:probe')]
#[Description('Probe every probeable org account for its current usage')]
class ProbeAccountUsage extends Command
{
    /**
     * Iterate every {@see Account::scopeProbeable()} (Claude) and
     * {@see Account::scopeCodexProbeable()} (Codex) account, probing each
     * with its provider's prober, and report how many accounts were
     * attempted versus how many produced a recorded snapshot.
     *
     * @param  UsageProber  $prober  the service that probes a single Claude account
     * @param  CodexUsageProber  $codexProber  the service that probes a single Codex account
     * @return int the command exit code
     */
    public function handle(UsageProber $prober, CodexUsageProber $codexProber): int
    {
        $probed = 0;
        $recorded = 0;

        $accounts = Account::probeable()->get()->merge(Account::codexProbeable()->get());

        $accounts->each(function (Account $account) use ($prober, $codexProber, &$probed, &$recorded): void {
            $probed++;

            try {
                $snapshot = $account->provider === 'codex'
                    ? $codexProber->probe($account)
                    : $prober->probe($account);
                if ($snapshot !== null) {
                    $recorded++;
                }
            } catch (Throwable $exception) {
                report($exception);
            }
        });

        $this->info("probed {$probed} accounts, {$recorded} snapshots");

        return self::SUCCESS;
    }
}
