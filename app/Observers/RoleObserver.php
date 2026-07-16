<?php

namespace App\Observers;

use App\Services\Roles\DefaultRoleAssigner;
use Spatie\Permission\Models\Role;

/**
 * Keeps default-role assignment in sync: whenever a role becomes default,
 * assign it across all users.
 */
class RoleObserver
{
    /**
     * When a role is saved with `is_default` newly true, sync default roles
     * to all users. Unrelated saves (renaming a role, editing permissions)
     * do not trigger a re-sync.
     *
     * @param  Role  $role  the saved role
     * @return void
     */
    public function saved(Role $role): void
    {
        if ($role->wasChanged('is_default') && (bool) $role->is_default === true) {
            app(DefaultRoleAssigner::class)->syncAll();
        }
    }
}
