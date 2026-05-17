<?php

namespace App\Services\Recap;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class RecapPoster
{
    /**
     * @param  array{text: string, blocks: array<int, array<string, mixed>>}  $payload
     */
    public function post(RecapWindow $window, array $payload): bool
    {
        $url = config('services.slack_notifier.webhook_url');

        if (! $url) {
            Log::debug('Slack recap skipped: webhook URL not configured', [
                'period' => $window->period,
            ]);

            return false;
        }

        try {
            Http::post($url, $payload);

            return true;
        } catch (Throwable $e) {
            Log::warning('Slack recap notification failed', [
                'period' => $window->period,
                'start' => $window->start->toIso8601String(),
                'end' => $window->end->toIso8601String(),
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
