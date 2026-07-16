<?php

namespace App\Console\Commands;

use App\Services\Roles\DefaultRoleAssigner;
use Illuminate\Console\Command;

/**
 * Assigns every default role to every user. Run after toggling a role's
 * default flag or after a deploy that introduces new default roles.
 */
class SyncDefaultRoles extends Command
{
    /**
     * The console command signature.
     *
     * @var string
     */
    protected $signature = 'roles:sync-defaults';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign all default roles to all users';

    /**
     * Execute the console command.
     *
     * @param  DefaultRoleAssigner  $assigner  the default-role assignment service
     * @return int
     */
    public function handle(DefaultRoleAssigner $assigner): int
    {
        $count = $assigner->syncAll();

        $this->info("Synced default roles to {$count} user(s).");

        return self::SUCCESS;
    }
}
