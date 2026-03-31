<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FacebookController;
use App\Http\Controllers\InstagramController;
use App\Http\Middleware\EnsureFacebookToken;
use App\Http\Middleware\EnsureInstagramToken;
use Illuminate\Support\Facades\Route;

// Auth status (no middleware needed)
Route::get('/auth/status', [AuthController::class, 'status']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Instagram
Route::prefix('instagram')->middleware(EnsureInstagramToken::class)->group(function () {
    Route::get('/profile', [InstagramController::class, 'profile']);
    Route::get('/media', [InstagramController::class, 'media']);
    Route::get('/insights', [InstagramController::class, 'insights']);
    Route::get('/media/{mediaId}/insights', [InstagramController::class, 'mediaInsights']);

    Route::post('/publish/photo', [InstagramController::class, 'publishPhoto']);
    Route::post('/publish/reel', [InstagramController::class, 'publishReel']);
    Route::post('/publish/carousel', [InstagramController::class, 'publishCarousel']);

    Route::get('/media/{mediaId}/comments', [InstagramController::class, 'comments']);
    Route::post('/media/{mediaId}/comments/reply', [InstagramController::class, 'replyToComment']);
    Route::post('/comments/{commentId}/hide', [InstagramController::class, 'hideComment']);
    Route::delete('/comments/{commentId}', [InstagramController::class, 'deleteComment']);
});

// Facebook
Route::prefix('facebook')->middleware(EnsureFacebookToken::class)->group(function () {
    Route::get('/pages', [FacebookController::class, 'pages']);
    Route::get('/page', [FacebookController::class, 'pageInfo']);
    Route::get('/page/posts', [FacebookController::class, 'posts']);
    Route::get('/page/insights', [FacebookController::class, 'insights']);

    Route::post('/page/publish', [FacebookController::class, 'publishPost']);
    Route::post('/page/publish/photo', [FacebookController::class, 'publishPhoto']);

    Route::delete('/posts/{postId}', [FacebookController::class, 'deletePost']);
});
