<?php

use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    require __DIR__.'/head.php';
    require __DIR__.'/pdrrmo.php';
    require __DIR__.'/guest.php';
});

require __DIR__.'/settings.php';
