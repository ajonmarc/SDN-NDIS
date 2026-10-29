<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class MunicipalityController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/municipalities/Index');
    }
}

