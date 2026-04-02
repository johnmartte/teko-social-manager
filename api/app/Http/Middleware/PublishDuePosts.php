<?php

namespace App\Http\Middleware;

use App\Models\ScheduledPost;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * "Poor man's cron" — after every response, check for scheduled posts
 * that are due and fire a background process to publish them.
 * Uses a simple file lock to prevent multiple concurrent publishes.
 */
class PublishDuePosts
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        try {
            $lockFile = storage_path('app/publish.lock');

            // If lock file exists and is less than 2 minutes old, skip
            if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 120) {
                return;
            }

            $hasDue = ScheduledPost::where('status', 'pending')
                ->where('scheduled_at', '<=', now())
                ->exists();

            if (!$hasDue) {
                return;
            }

            // Create/touch lock file BEFORE dispatching
            file_put_contents($lockFile, (string) time());

            // Fire in background
            $cmd = 'php ' . base_path('artisan') . ' posts:publish-scheduled > /dev/null 2>&1 &';
            pclose(popen($cmd, 'r'));

            Log::info('PublishDuePosts: dispatched background publish.');
        } catch (\Throwable $e) {
            Log::warning('PublishDuePosts terminate failed', [
                'message' => $e->getMessage(),
            ]);
        }
    }
}
