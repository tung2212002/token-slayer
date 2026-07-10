<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\Cache;

final class AccountResolver
{
    /**
     * Cache key of the lowercase-email → account-id map. Invalidated by Account model events.
     *
     * @var string
     */
    public const string CACHE_KEY = 'accounts:email-map';

    /**
     * Cache key of the organization-uuid → account-id map.
     *
     * Invalidated alongside the email map by Account model saved/deleted events.
     *
     * @var string
     */
    public const string ORG_CACHE_KEY = 'accounts:org-map';

    /**
     * How long the email map is cached before a natural refresh.
     *
     * @var int
     */
    private const int CACHE_TTL_SECONDS = 3600;

    /**
     * Match a hook-claimed account against the org accounts table, preferring
     * the beacon-verified organization uuid and falling back to the
     * self-reported email when the uuid is absent or unknown.
     *
     * @param  ?string  $orgId  Anthropic organization uuid, exact match
     * @param  ?string  $email  raw email claimed by the client, any case
     * @return ?int the matching account id, or null when unknown/absent
     */
    public function resolve(?string $orgId, ?string $email): ?int
    {
        $byOrg = $this->resolveByOrgId($orgId);
        if ($byOrg !== null) {
            return $byOrg;
        }

        return $this->resolveByEmail($email);
    }

    /**
     * Match an organization uuid against the org-uuid map. The map is cached
     * for CACHE_TTL_SECONDS and invalidated by Account::booted() on save/delete.
     *
     * @param  ?string  $orgId  Anthropic organization uuid, exact match
     * @return ?int the matching account id, or null when unknown/absent
     */
    private function resolveByOrgId(?string $orgId): ?int
    {
        if ($orgId === null || trim($orgId) === '') {
            return null;
        }

        $map = Cache::remember(self::ORG_CACHE_KEY, self::CACHE_TTL_SECONDS, function (): array {
            return Account::query()
                ->whereNotNull('organization_uuid')
                ->pluck('id', 'organization_uuid')
                ->all();
        });

        return $map[trim($orgId)] ?? null;
    }

    /**
     * Match a lowercase email against the email map. The map is cached for
     * CACHE_TTL_SECONDS and invalidated by Account::booted() on save/delete.
     *
     * @param  ?string  $email  raw email claimed by the client, any case
     * @return ?int the matching account id, or null when unknown/absent
     */
    private function resolveByEmail(?string $email): ?int
    {
        if ($email === null || trim($email) === '') {
            return null;
        }

        $map = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function (): array {
            return Account::query()
                ->pluck('id', 'email')
                ->mapWithKeys(fn (int $id, string $email): array => [mb_strtolower($email) => $id])
                ->all();
        });

        return $map[mb_strtolower(trim($email))] ?? null;
    }
}
