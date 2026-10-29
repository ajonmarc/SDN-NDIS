<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DisasterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/disasters/Index');
    }
}

