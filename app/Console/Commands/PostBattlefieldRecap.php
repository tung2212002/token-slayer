<?php

namespace App\Console\Commands;

use App\Services\Recap\RecapDataCollector;
use App\Services\Recap\RecapMessage;
use App\Services\Recap\RecapPoster;
use App\Services\Recap\RecapWindow;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use InvalidArgumentException;

#[Signature('battlefield:recap {period : daily|weekly|monthly|yearly}')]
#[Description('Post a battlefield recap to Slack for the previous full period')]
class PostBattlefieldRecap extends Command
{
    public function handle(
        RecapDataCollector $collector,
        RecapMessage $message,
        RecapPoster $poster,
    ): int {
        $period = (string) $this->argument('period');

        try {
            $window = RecapWindow::for($period);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::INVALID;
        }

        $snapshot = $collector->collect($window);

        if ($window->isDaily() && $snapshot->isEmpty()) {
            $this->info('No activity for daily window; skipping Slack post.');

            return self::SUCCESS;
        }

        $poster->post($window, $message->build($snapshot));

        return self::SUCCESS;
    }
}
