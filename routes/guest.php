<?php


use App\Http\Controllers\Guest\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:GUEST')->prefix('guest')->name('guest.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});