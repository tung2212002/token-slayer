<?php

use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\Ide\AuthController;
use App\Http\Controllers\Api\Ide\HookConfigController;
use App\Http\Controllers\Api\Ide\MeController;
use App\Http\Controllers\Api\StateController;
use Illuminate\Support\Facades\Route;

Route::post('/events', [EventController::class, 'store'])
    ->middleware('hook.token');

Route::get('/state', [StateController::class, 'show']);

Route::prefix('ide')->group(function (): void {
    Route::post('/auth/exchange', [AuthController::class, 'exchange']);

    Route::middleware('ide.bearer')->group(function (): void {
        Route::post('/auth/revoke', [AuthController::class, 'revoke']);
        Route::post('/auth/session-url', [AuthController::class, 'sessionUrl']);
        Route::get('/me', MeController::class);
        Route::get('/hook-config', HookConfigController::class);
    });
});
