<?php

namespace App\Filament\Resources\Shield\Pages;

use App\Filament\Resources\Shield\RoleResource;
use BezhanSalleh\FilamentShield\Resources\Roles\Pages\EditRole as BaseEditRole;
use Illuminate\Support\Arr;

/**
 * Re-points Shield's edit page at our `RoleResource` subclass so the
 * `is_default` toggle actually renders (Shield's own page hardcodes
 * `$resource` to its own base resource — see `ListRoles` in this namespace)
 * and survives the save.
 */
class EditRole extends BaseEditRole
{
    /**
     * @var class-string<RoleResource>
     */
    protected static string $resource = RoleResource::class;

    /**
     * Shield's own implementation treats every form key other than
     * `name`/`guard_name`/`select_all`/the tenant key as a permission name to
     * sync onto the role, then whitelists only `name`/`guard_name` back into
     * the persisted attributes. `is_default` would otherwise be swept into
     * that permission-name collection (and then dropped entirely). Pull it
     * out before delegating, then restore it on the whitelisted result.
     *
     * @param  array<string, mixed>  $data  the raw form state
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $isDefault = (bool) Arr::pull($data, 'is_default', false);

        $data = parent::mutateFormDataBeforeSave($data);

        $data['is_default'] = $isDefault;

        return $data;
    }
}
