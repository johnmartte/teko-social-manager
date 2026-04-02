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
 * Uses popen() so it doesn't block the main PHP thread (artisan serve
 * is single-threaded — blocking here would freeze ALL requests).
 */
class PublishDuePosts
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Runs AFTER the response has been sent to the client.
     */
    public function terminate(Request $request, Response $response): void
    {
        try {
            // Quick DB check — lightweight, ~1ms
            $hasDue = ScheduledPost::where('status', 'pending')
                ->where('scheduled_at', '<=', now())
                ->exists();

            if (!$hasDue) {
                return;
            }

            // Fire the artisan command in background — does NOT block
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
