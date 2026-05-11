<?php

use App\Http\Controllers\Api\EventController;
use Illuminate\Support\Facades\Route;

Route::post('/events', [EventController::class, 'store'])
    ->middleware('hook.token');
