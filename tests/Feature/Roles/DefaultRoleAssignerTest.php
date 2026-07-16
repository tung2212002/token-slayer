<?php

use App\Models\User;
use App\Services\Roles\DefaultRoleAssigner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('assigns default roles to a single user and stays idempotent', function () {
    // `is_default` is set via forceFill, not the create() array: an earlier
    // migration (migrate_is_admin_to_super_admin_role) mass-assigns a Role
    // before this column exists, which poisons Eloquent's per-process
    // guarded-column cache and silently drops `is_default` from any later
    // Role::create() call that includes it in the attributes array.
    $default = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $default->forceFill(['is_default' => true])->save();
    Role::create(['name' => 'editor', 'guard_name' => 'web']);
    $user = User::factory()->create();

    app(DefaultRoleAssigner::class)->assignTo($user);
    app(DefaultRoleAssigner::class)->assignTo($user);

    expect($user->fresh()->roles->pluck('name')->all())->toBe(['viewer']);
});

it('syncs default roles to all existing users', function () {
    $default = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $default->forceFill(['is_default' => true])->save();
    User::factory()->count(3)->create();

    $touched = app(DefaultRoleAssigner::class)->syncAll();

    expect($touched)->toBe(3);
    User::all()->each(fn (User $u) => expect($u->hasRole('viewer'))->toBeTrue());
});
