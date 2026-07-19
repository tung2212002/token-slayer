<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Services\SessionAnchorer;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Sends a one-token anchor message to every probeable account so Anthropic's
 * rolling 5-hour usage window starts at this command's scheduled clock time.
 * {@see SessionAnchorer::anchor} swallows expected failures (dead token,
 * transient HTTP error); the try/catch here is a safety net so an unexpected
 * exception in one account cannot abort the rest of the batch. Deliberately
 * has no retry — a late run would anchor the window at the wrong time.
 */
#[Signature('accounts:anchor-sessions')]
#[Description('Send a one-token message to every probeable account to anchor its 5h usage window')]
class AnchorAccountSessions extends Command
{
    /**
     * Iterate every {@see Account::scopeProbeable()} account, anchoring each
     * in turn, and report how many were attempted versus anchored.
     *
     * @param  SessionAnchorer  $anchorer  the service that anchors a single account
     * @return int the command exit code
     */
    public function handle(SessionAnchorer $anchorer): int
    {
        $attempted = 0;
        $anchored = 0;

        Account::probeable()->get()->each(function (Account $account) use ($anchorer, &$attempted, &$anchored): void {
            $attempted++;

            try {
                if ($anchorer->anchor($account)) {
                    $anchored++;
                }
            } catch (Throwable $exception) {
                report($exception);
            }
        });

        $this->info("anchored {$anchored} of {$attempted} accounts");

        return self::SUCCESS;
    }
}
