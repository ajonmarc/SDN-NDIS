<?php

use App\Http\Controllers\Superadmin\DashboardController;
use App\Http\Controllers\Superadmin\DocumentationController;

use Illuminate\Support\Facades\Route;

Route::middleware('role:Superadmin,PDRRMO')->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('documentation', [DocumentationController::class, 'index'])->name('documentation');  

});
