<?php

use App\Http\Controllers\Guest\DashboardController;
use App\Http\Controllers\Guest\DisasterController;
use App\Http\Controllers\Guest\EvacuationCenterController;
use App\Http\Controllers\Guest\MapController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:GUEST')
    ->prefix('guest')
    ->name('guest.')
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('map', [MapController::class, 'index'])->name('map.index');
        Route::get('disasters', [DisasterController::class, 'index'])->name('disasters.index');
        Route::get('evacuation-centers', [EvacuationCenterController::class, 'index'])->name('evacuation-centers.index');
    });
