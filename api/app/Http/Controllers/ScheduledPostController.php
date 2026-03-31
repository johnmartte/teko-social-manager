<?php

namespace App\Http\Controllers;

use App\Models\ScheduledPost;
use App\Services\MetaApiService;
use Illuminate\Http\Request;

class ScheduledPostController extends Controller
{
    public function __construct(protected MetaApiService $meta) {}

    public function index(): \Illuminate\Http\JsonResponse
    {
        $posts = ScheduledPost::orderBy('scheduled_at')->get();
        return response()->json($posts);
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'platform'     => 'required|in:instagram,facebook,both',
            'type'         => 'required|in:photo,reel,carousel,text',
            'caption'      => 'nullable|string',
            'media_urls'   => 'nullable|array',
            'media_urls.*' => 'url',
            'scheduled_at' => 'required|date|after:now',
        ]);

        $data['ig_token']   = $request->header('X-IG-Token');
        $data['ig_user_id'] = $request->header('X-IG-User-Id');
        $data['fb_token']   = $request->header('X-FB-Token');
        $data['fb_page_id'] = $request->header('X-FB-Page-Id');

        $post = ScheduledPost::create($data);

        return response()->json($post, 201);
    }

    public function destroy(ScheduledPost $scheduledPost): \Illuminate\Http\JsonResponse
    {
        if ($scheduledPost->status === 'published') {
            return response()->json(['error' => 'No se puede eliminar un post ya publicado'], 422);
        }
        $scheduledPost->delete();
        return response()->json(['success' => true]);
    }

    public function publish(ScheduledPost $scheduledPost): \Illuminate\Http\JsonResponse
    {
        if ($scheduledPost->status === 'published') {
            return response()->json(['error' => 'Ya fue publicado'], 422);
        }

        try {
            $this->publishNow($scheduledPost);
            return response()->json(['success' => true, 'post' => $scheduledPost->fresh()]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function publishNow(ScheduledPost $post): void
    {
        $igToken  = $post->ig_token;
        $igUserId = $post->ig_user_id;
        $fbToken  = $post->fb_token;
        $fbPageId = $post->fb_page_id;
        $caption  = (string) $post->caption;
        $urls     = $post->media_urls ?? [];

        try {
            if (in_array($post->platform, ['instagram', 'both']) && $igToken && $igUserId) {
                match ($post->type) {
                    'photo'    => $this->meta->publishPhoto($igUserId, $igToken, $urls[0] ?? '', $caption),
                    'reel'     => $this->meta->publishReel($igUserId, $igToken, $urls[0] ?? '', $caption),
                    'carousel' => $this->meta->publishCarousel($igUserId, $igToken, $urls, $caption),
                    default    => null,
                };
            }

            if (in_array($post->platform, ['facebook', 'both']) && $fbToken && $fbPageId) {
                if ($post->type === 'text') {
                    $this->meta->publishPagePost($fbPageId, $fbToken, $caption);
                } else {
                    $this->meta->publishPagePhoto($fbPageId, $fbToken, $urls[0] ?? '', $caption);
                }
            }

            $post->update(['status' => 'published']);
        } catch (\Throwable $e) {
            $post->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            throw $e;
        }
    }
}
