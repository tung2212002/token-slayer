<?php

namespace App\Services\Recap;

use Illuminate\Support\Collection;

class RecapMessage
{
    private const MEDALS = ['🥇', '🥈', '🥉'];

    private const PROVIDER_LABELS = [
        'claude-code' => 'Claude Code',
        'codex' => 'Codex',
    ];

    /**
     * @return array{text: string, blocks: array<int, array<string, mixed>>}
     */
    public function build(RecapSnapshot $snapshot): array
    {
        return [
            'text' => $this->fallbackText($snapshot),
            'blocks' => $this->blocks($snapshot),
        ];
    }

    private function fallbackText(RecapSnapshot $snapshot): string
    {
        return sprintf(
            '%s · 🐉 %d slain · ⚔️ %s',
            $snapshot->window->title(),
            $snapshot->bossesSlain,
            $this->formatTokens($snapshot->totalDamage),
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function blocks(RecapSnapshot $snapshot): array
    {
        $blocks = [
            [
                'type' => 'header',
                'text' => [
                    'type' => 'plain_text',
                    'text' => $snapshot->window->title(),
                    'emoji' => true,
                ],
            ],
            [
                'type' => 'section',
                'fields' => $this->summaryFields($snapshot),
            ],
        ];

        if ($snapshot->leaderboard->isNotEmpty()) {
            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*🏆 Top fighters*\n".$this->renderLeaderboard($snapshot),
                ],
            ];
        }

        $blocks[] = [
            'type' => 'context',
            'elements' => [
                ['type' => 'mrkdwn', 'text' => $this->contextFooter($snapshot)],
            ],
        ];

        return $blocks;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function summaryFields(RecapSnapshot $snapshot): array
    {
        $fields = [
            [
                'type' => 'mrkdwn',
                'text' => "*🐉 Bosses slain*\n".number_format($snapshot->bossesSlain),
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*⚔️ Total damage*\n".$this->formatTokens($snapshot->totalDamage).' tokens',
            ],
        ];

        if ($snapshot->window->isDaily()) {
            return $fields;
        }

        $fields[] = [
            'type' => 'mrkdwn',
            'text' => "*👥 Active fighters*\n".number_format($snapshot->activeFighters),
        ];

        $providerLine = $this->renderProviderSplit($snapshot->providerSplit);

        if ($providerLine !== null) {
            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*🤖 By provider*\n".$providerLine,
            ];
        }

        return $fields;
    }

    private function renderLeaderboard(RecapSnapshot $snapshot): string
    {
        $isDaily = $snapshot->window->isDaily();

        return $snapshot->leaderboard
            ->values()
            ->map(fn (RecapFighter $fighter, int $i) => $this->renderFighterLine($fighter, $i, $isDaily))
            ->implode("\n");
    }

    private function renderFighterLine(RecapFighter $fighter, int $rank, bool $isDaily): string
    {
        $marker = self::MEDALS[$rank] ?? sprintf('%d.', $rank + 1);
        $base = sprintf('%s %s — %s', $marker, $fighter->mention(), $this->formatTokens($fighter->damage));

        if ($isDaily || $fighter->kills === 0) {
            return $base;
        }

        return sprintf('%s (%d %s)', $base, $fighter->kills, $fighter->kills === 1 ? 'kill' : 'kills');
    }

    /**
     * @param  array<string, int>  $providerSplit
     */
    private function renderProviderSplit(array $providerSplit): ?string
    {
        if ($providerSplit === []) {
            return null;
        }

        return Collection::make($providerSplit)
            ->sortDesc()
            ->map(fn (int $damage, string $provider) => sprintf(
                '%s %s',
                self::PROVIDER_LABELS[$provider] ?? $provider,
                $this->formatTokens($damage),
            ))
            ->implode(' · ');
    }

    private function contextFooter(RecapSnapshot $snapshot): string
    {
        $window = $snapshot->window;
        $tz = $window->start->format('P');
        $endInclusive = $window->end->subSecond();

        return sprintf(
            '%s → %s · %s',
            $window->start->format('Y-m-d H:i'),
            $endInclusive->format('Y-m-d H:i'),
            'UTC'.$tz,
        );
    }

    private function formatTokens(int $tokens): string
    {
        if ($tokens >= 1_000_000) {
            return $this->formatScaled($tokens / 1_000_000, 'M');
        }

        if ($tokens >= 1_000) {
            return $this->formatScaled($tokens / 1_000, 'K');
        }

        return (string) $tokens;
    }

    private function formatScaled(float $value, string $suffix): string
    {
        $formatted = number_format($value, 1);

        if (str_ends_with($formatted, '.0')) {
            $formatted = substr($formatted, 0, -2);
        }

        return $formatted.$suffix;
    }
}
