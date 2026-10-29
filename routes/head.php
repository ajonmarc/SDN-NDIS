<?php

use App\Http\Controllers\Head\DashboardController;
use App\Http\Controllers\Head\DocumentationController;
use App\Http\Controllers\Head\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:HEAD')
    ->prefix('head')
    ->name('head.')
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
        | Users (HEAD Only)
        |--------------------------------------------------------------------------
        */

        Route::get('users/data', [
            UserController::class,
            'getData',
        ])->name('users.data');

        Route::resource('users', UserController::class);

        Route::get('documentation', [
            DocumentationController::class,
            'index',
        ])->name('documentation');

    });

