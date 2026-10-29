<?php

namespace App\Http\Controllers\Head;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DocumentationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('head/documentation/Index');
    }
}
