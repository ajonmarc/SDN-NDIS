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

        Route::get('disaster-types/data', [
            DisasterTypeController::class,
            'getData',
        ])->name('disaster-types.data');

        Route::resource('disaster-types', DisasterTypeController::class)
            ->parameters(['disaster-types' => 'disasterType'])
            ->except(['create', 'show', 'edit']);

        /*
        |--------------------------------------------------------------------------
        | Disasters
        |--------------------------------------------------------------------------
        */

        Route::get('disasters/data', [
            DisasterController::class,
            'getData',
        ])->name('disasters.data');

        Route::resource('disasters', DisasterController::class)
            ->except(['create', 'show', 'edit']);

        /*
        |--------------------------------------------------------------------------
        | Disaster Updates
        |--------------------------------------------------------------------------
        */

        Route::get('disaster-updates/data', [
            DisasterUpdateController::class,
            'getData',
        ])->name('disaster-updates.data');

        Route::resource('disaster-updates', DisasterUpdateController::class)
            ->parameters(['disaster-updates' => 'disasterUpdate'])
            ->except(['create', 'show', 'edit']);

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
