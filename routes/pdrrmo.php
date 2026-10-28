<?php

use App\Http\Controllers\Pdrrmo\DashboardController;
use App\Http\Controllers\Pdrrmo\UserController;
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


        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        Route::get('users/data', [
            UserController::class,
            'getData',
        ])->name('users.data');

        Route::resource('users', UserController::class);

    });