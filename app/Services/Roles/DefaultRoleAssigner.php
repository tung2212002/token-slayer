<?php

namespace App\Services\Roles;

use App\Models\User;
use Spatie\Permission\Models\Role;

/**
 * Assigns roles flagged `is_default` to users. Every user is meant to carry
 * the default roles (the admin panel is intentionally open to all logged-in
 * users); new users get them at registration, existing users via `syncAll()`.
 */
final class DefaultRoleAssigner
{
    /**
     * Assign every default role to one user. Idempotent — `assignRole` skips
     * roles the user already has.
     *
     * @param  User  $user  the user to grant default roles to
     * @return void
     */
    public function assignTo(User $user): void
    {
        $names = $this->defaultRoleNames();

        if ($names === []) {
            return;
        }

        $user->assignRole($names);
    }

    /**
     * Assign default roles to every user in the system.
     *
     * @return int the number of users processed
     */
    public function syncAll(): int
    {
        $names = $this->defaultRoleNames();

        if ($names === []) {
            return 0;
        }

        $count = 0;

        User::query()->chunkById(200, function ($users) use ($names, &$count): void {
            foreach ($users as $user) {
                $user->assignRole($names);
                $count++;
            }
        });

        return $count;
    }

    /**
     * The names of all roles flagged as default (guard `web`).
     *
     * @return array<int, string>
     */
    private function defaultRoleNames(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->where('is_default', true)
            ->pluck('name')
            ->all();
    }
}
