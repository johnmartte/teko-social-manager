<?php

namespace App\Console\Commands;

use App\Http\Controllers\ScheduledPostController;
use App\Models\ScheduledPost;
use Illuminate\Console\Command;

class PublishScheduledPosts extends Command
{
    protected $signature   = 'posts:publish-scheduled';
    protected $description = 'Publish scheduled posts that are due';

    public function handle(ScheduledPostController $controller): void
    {
        // Atomically claim due posts by setting status to 'publishing'
        // This prevents duplicate publishes if the command runs concurrently
        $claimed = ScheduledPost::where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->update(['status' => 'publishing']);

        if ($claimed === 0) {
            $this->line('No posts due.');
            return;
        }

        $posts = ScheduledPost::where('status', 'publishing')->get();

        foreach ($posts as $post) {
            try {
                $controller->publishNow($post);
                $this->info("Published post #{$post->id}");
            } catch (\Throwable $e) {
                $this->error("Failed post #{$post->id}: {$e->getMessage()}");
            }
        }
    }
}
