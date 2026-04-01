<?php

namespace App\Http\Middleware;

use App\Http\Controllers\ScheduledPostController;
use App\Models\ScheduledPost;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * "Poor man's cron" — after every response, check for scheduled posts
 * that are due and publish them. Runs in the terminate phase so it
 * doesn't add latency to the user's request.
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
            // Quick check — avoid heavy queries on every request
            $due = ScheduledPost::where('status', 'pending')
                ->where('scheduled_at', '<=', now())
                ->limit(5)
                ->get();

            if ($due->isEmpty()) {
                return;
            }

            $controller = app(ScheduledPostController::class);

            foreach ($due as $post) {
                try {
                    $controller->publishNow($post);
                } catch (\Throwable $e) {
                    // publishNow already updates status to 'failed'
                }
            }
        } catch (\Throwable $e) {
            // Never break the original HTTP request in terminate phase.
            Log::warning('PublishDuePosts terminate failed', [
                'message' => $e->getMessage(),
            ]);
        }
    }
}
