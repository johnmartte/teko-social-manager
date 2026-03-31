<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// OAuth flow (needs session cookies, so stays in web routes)
Route::get('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/callback', [AuthController::class, 'callback']);
