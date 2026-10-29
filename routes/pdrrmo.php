<?php

use App\Http\Controllers\Pdrrmo\AccessLogController;
use App\Http\Controllers\Pdrrmo\DashboardController;
use App\Http\Controllers\Pdrrmo\DisasterController;
use App\Http\Controllers\Pdrrmo\DisasterTypeController;
use App\Http\Controllers\Pdrrmo\DisasterUpdateController;
use App\Http\Controllers\Pdrrmo\EvacuationCenterController;
use App\Http\Controllers\Pdrrmo\MunicipalityController;
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
        | Municipalities
        |--------------------------------------------------------------------------
        */

        Route::get('municipalities', [
            MunicipalityController::class,
            'index',
        ])->name('municipalities.index');

        /*
        |--------------------------------------------------------------------------
        | Disaster Types
        |--------------------------------------------------------------------------
        */

        Route::get('disaster-types', [
            DisasterTypeController::class,
            'index',
        ])->name('disaster-types.index');

        /*
        |--------------------------------------------------------------------------
        | Disasters
        |--------------------------------------------------------------------------
        */

        Route::get('disasters', [
            DisasterController::class,
            'index',
        ])->name('disasters.index');

        /*
        |--------------------------------------------------------------------------
        | Disaster Updates
        |--------------------------------------------------------------------------
        */

        Route::get('disaster-updates', [
            DisasterUpdateController::class,
            'index',
        ])->name('disaster-updates.index');

        /*
        |--------------------------------------------------------------------------
        | Evacuation Centers
        |--------------------------------------------------------------------------
        */

        Route::get('evacuation-centers', [
            EvacuationCenterController::class,
            'index',
        ])->name('evacuation-centers.index');

        /*
        |--------------------------------------------------------------------------
        | Access Logs
        |--------------------------------------------------------------------------
        */

        Route::get('access-logs', [
            AccessLogController::class,
            'index',
        ])->name('access-logs.index');

    });
