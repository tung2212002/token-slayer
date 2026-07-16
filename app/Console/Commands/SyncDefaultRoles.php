<?php

namespace App\Console\Commands;

use App\Services\Roles\DefaultRoleAssigner;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Assigns every default role to every user, delegating the assignment work
 * to {@see DefaultRoleAssigner}. Run manually after toggling a role's
 * default flag or after a deploy that introduces new default roles.
 */
#[Signature('roles:sync-defaults')]
#[Description('Assign all default roles to all users')]
class SyncDefaultRoles extends Command
{
    /**
     * Sync default roles to every user and report how many were touched.
     *
     * @param  DefaultRoleAssigner  $assigner  the default-role assignment service
     * @return int the command exit code
     */
    public function handle(DefaultRoleAssigner $assigner): int
    {
        $count = $assigner->syncAll();

        $this->info("Synced default roles to {$count} user(s).");

        return self::SUCCESS;
    }
}
