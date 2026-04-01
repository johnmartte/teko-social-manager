<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FacebookController;
use App\Http\Controllers\InstagramController;
use App\Http\Controllers\ScheduledPostController;
use App\Http\Controllers\SystemAuthController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

// Auth (no middleware required — Sanctum optional inside methods)
Route::get('/auth/status', [AuthController::class, 'status']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// System auth (email/password)
Route::post('/auth/system/register', [SystemAuthController::class, 'register']);
Route::post('/auth/system/login', [SystemAuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/system/me', [SystemAuthController::class, 'me']);
    Route::post('/auth/system/logout', [SystemAuthController::class, 'logout']);
    Route::patch('/auth/system/email', [SystemAuthController::class, 'updateEmail']);
    Route::patch('/auth/system/password', [SystemAuthController::class, 'updatePassword']);

    Route::get('/workspace/dashboard', [WorkspaceController::class, 'dashboard']);
    Route::get('/workspace/planner/meta', [WorkspaceController::class, 'plannerMeta']);
    Route::get('/workspace/social/meta', [WorkspaceController::class, 'socialMeta']);
    Route::get('/workspace/inbox', [WorkspaceController::class, 'inbox']);
    Route::post('/workspace/inbox/templates', [WorkspaceController::class, 'addTemplate']);
    Route::get('/workspace/automations', [WorkspaceController::class, 'automations']);
    Route::patch('/workspace/automations/{automationRule}/toggle', [WorkspaceController::class, 'toggleAutomation']);
});

// File upload
Route::post('/upload', [UploadController::class, 'upload']);

// Instagram
Route::prefix('instagram')->middleware('social:instagram')->group(function () {
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
Route::prefix('facebook')->middleware('social:facebook')->group(function () {
    Route::get('/pages', [FacebookController::class, 'pages']);
    Route::get('/page', [FacebookController::class, 'pageInfo']);
    Route::get('/page/posts', [FacebookController::class, 'posts']);
    Route::get('/page/insights', [FacebookController::class, 'insights']);

    Route::post('/page/publish', [FacebookController::class, 'publishPost']);
    Route::post('/page/publish/photo', [FacebookController::class, 'publishPhoto']);

    Route::delete('/posts/{postId}', [FacebookController::class, 'deletePost']);
    Route::patch('/posts/{postId}', [FacebookController::class, 'updatePost']);
});

// Scheduled posts
Route::get('/scheduled-posts', [ScheduledPostController::class, 'index']);
Route::post('/scheduled-posts', [ScheduledPostController::class, 'store']);
Route::delete('/scheduled-posts/{scheduledPost}', [ScheduledPostController::class, 'destroy']);
Route::post('/scheduled-posts/{scheduledPost}/publish', [ScheduledPostController::class, 'publish']);
