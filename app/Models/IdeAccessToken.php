<?php

namespace App\Models;

use Database\Factories\IdeAccessTokenFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class IdeAccessToken extends Model
{
    /** @use HasFactory<IdeAccessTokenFactory> */
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array{0: string, 1: self}
     */
    public static function issueOneTime(User $user, string $state, int $ttlSeconds): array
    {
        $plain = Str::random(64);

        $token = self::create([
            'user_id' => $user->id,
            'kind' => 'one_time',
            'token_hash' => hash('sha256', $plain),
            'state_hash' => hash('sha256', $state),
            'expires_at' => now()->addSeconds($ttlSeconds),
        ]);

        return [$plain, $token];
    }

    public static function consumeOneTime(string $plain, string $state): ?User
    {
        $tokenHash = hash('sha256', $plain);
        $stateHash = hash('sha256', $state);

        $affected = self::query()
            ->where('kind', 'one_time')
            ->where('token_hash', $tokenHash)
            ->where('state_hash', $stateHash)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->update(['consumed_at' => now()]);

        if ($affected === 0) {
            return null;
        }

        return self::query()
            ->where('token_hash', $tokenHash)
            ->first()
            ?->user;
    }

    /**
     * @return array{0: string, 1: self}
     */
    public static function issueBearer(User $user): array
    {
        $plain = Str::random(64);

        $token = self::create([
            'user_id' => $user->id,
            'kind' => 'bearer',
            'token_hash' => hash('sha256', $plain),
        ]);

        return [$plain, $token];
    }

    public static function resolveBearer(string $plain): ?User
    {
        $token = self::query()
            ->where('kind', 'bearer')
            ->where('token_hash', hash('sha256', $plain))
            ->whereNull('revoked_at')
            ->first();

        if ($token === null) {
            return null;
        }

        $token->forceFill(['last_used_at' => now()])->save();

        return $token->user;
    }

    /**
     * @return array{0: string, 1: self}
     */
    public static function issueSessionUrl(User $user, string $redirectPath, int $ttlSeconds): array
    {
        $plain = Str::random(64);

        $token = self::create([
            'user_id' => $user->id,
            'kind' => 'session_url',
            'token_hash' => hash('sha256', $plain),
            'redirect_path' => $redirectPath,
            'expires_at' => now()->addSeconds($ttlSeconds),
        ]);

        return [$plain, $token];
    }

    /**
     * @return array{user: User, redirectPath: string}|null
     */
    public static function consumeSessionUrl(string $plain): ?array
    {
        $tokenHash = hash('sha256', $plain);

        $affected = self::query()
            ->where('kind', 'session_url')
            ->where('token_hash', $tokenHash)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->update(['consumed_at' => now()]);

        if ($affected === 0) {
            return null;
        }

        $token = self::query()
            ->where('token_hash', $tokenHash)
            ->first();

        if ($token === null) {
            return null;
        }

        return ['user' => $token->user, 'redirectPath' => $token->redirect_path ?? '/'];
    }

    public function revoke(): void
    {
        $this->update(['revoked_at' => now()]);
    }

    protected static function newFactory(): IdeAccessTokenFactory
    {
        return IdeAccessTokenFactory::new();
    }
}
