<?php

use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\StateController;
use Illuminate\Support\Facades\Route;

Route::post('/events', [EventController::class, 'store'])
    ->middleware('hook.token');

Route::get('/state', [StateController::class, 'show']);
