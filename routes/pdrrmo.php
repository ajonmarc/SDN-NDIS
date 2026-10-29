<?php

use App\Http\Controllers\Pdrrmo\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:PDRRMO')
    ->prefix('pdrrmo')
    ->name('pdrrmo.')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get('dashboard', [
            DashboardController::class,
            'index',
        ])->name('dashboard');

    });
