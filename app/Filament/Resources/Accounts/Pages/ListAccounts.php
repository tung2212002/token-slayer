<?php

namespace App\Filament\Resources\Accounts\Pages;

use App\Filament\Concerns\ConnectsAccounts;
use App\Filament\Concerns\ConnectsCodexAccounts;
use App\Filament\Resources\Accounts\AccountResource;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

/**
 * The Account index page of `AccountResource`. Hosts the open "Connect account"
 * header action and its method-resolved "confirmCreateAccount" follow-up modal
 * (Claude), plus the "Connect Codex account" device-code header action.
 */
class ListAccounts extends ListRecords
{
    use ConnectsAccounts;
    use ConnectsCodexAccounts;

    /**
     * The resource this page belongs to.
     *
     * @var class-string<AccountResource>
     */
    protected static string $resource = AccountResource::class;

    /**
     * Header actions available on the index page.
     *
     * @return array<Action>
     */
    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
            $this->connectAccountAction(),
            $this->connectCodexAccountAction(),
        ];
    }
}
