<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('lets a user be assigned a role and checked for it', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);
    $user = User::factory()->create();

    $user->assignRole('super_admin');

    expect($user->hasRole('super_admin'))->toBeTrue();
});
