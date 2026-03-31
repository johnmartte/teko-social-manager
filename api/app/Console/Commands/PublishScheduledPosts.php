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
        $due = ScheduledPost::where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($due->isEmpty()) {
            $this->line('No posts due.');
            return;
        }

        foreach ($due as $post) {
            try {
                $controller->publishNow($post);
                $this->info("Published post #{$post->id}");
            } catch (\Throwable $e) {
                $this->error("Failed post #{$post->id}: {$e->getMessage()}");
            }
        }
    }
}
