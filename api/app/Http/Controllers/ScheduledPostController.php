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
            'scheduled_at' => 'required|date|after:' . now()->subMinutes(5)->toDateTimeString(),
        ]);

        // ── Resolve tokens ────────────────────────────────────────────────────
        // Priority 1: Sanctum authenticated user → read from social_credentials DB
        // Priority 2: Legacy header tokens (backward compat)

        $user = auth('sanctum')->user();

        if ($user) {
            $user->load('socialCredentials');
            $ig = $user->socialCredential('instagram');
            $fb = $user->socialCredential('facebook');

            $data['ig_token']   = $ig?->access_token;
            $data['ig_user_id'] = $ig?->meta_user_id;
            $data['fb_token']   = $fb?->access_token;
            $data['fb_page_id'] = $fb?->meta_user_id;
        } else {
            // Fallback: read from legacy custom headers
            $data['ig_token']   = $request->header('X-IG-Token');
            $data['ig_user_id'] = $request->header('X-IG-User-Id');
            $data['fb_token']   = $request->header('X-FB-Token');
            $data['fb_page_id'] = $request->header('X-FB-Page-Id');
        }

        // Validate that we have credentials for the selected platform
        $needsIg = in_array($data['platform'], ['instagram', 'both']);
        $needsFb = in_array($data['platform'], ['facebook', 'both']);

        if ($needsIg && (empty($data['ig_token']) || empty($data['ig_user_id']))) {
            return response()->json(['error' => 'No hay credenciales de Instagram. Reconecta tu cuenta.'], 422);
        }

        if ($needsFb && empty($data['fb_token'])) {
            return response()->json(['error' => 'No hay credenciales de Facebook. Reconecta tu cuenta.'], 422);
        }

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
        if (in_array($scheduledPost->status, ['published', 'publishing'])) {
            return response()->json(['error' => 'Ya fue publicado o está en proceso'], 422);
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

        $published = false;

        try {
            if (in_array($post->platform, ['instagram', 'both'])) {
                if (!$igToken || !$igUserId) {
                    throw new \RuntimeException('Faltan credenciales de Instagram. Elimina y vuelve a programar este post.');
                }

                match ($post->type) {
                    'photo'    => $this->meta->publishPhoto($igUserId, $igToken, $urls[0] ?? '', $caption),
                    'reel'     => $this->meta->publishReel($igUserId, $igToken, $urls[0] ?? '', $caption),
                    'carousel' => $this->meta->publishCarousel($igUserId, $igToken, $urls, $caption),
                    default    => null,
                };

                $published = true;
            }

            if (in_array($post->platform, ['facebook', 'both'])) {
                if (!$fbToken || !$fbPageId) {
                    throw new \RuntimeException('Faltan credenciales de Facebook. Elimina y vuelve a programar este post.');
                }

                if ($post->type === 'text') {
                    $this->meta->publishPagePost($fbPageId, $fbToken, $caption);
                } else {
                    $this->meta->publishPagePhoto($fbPageId, $fbToken, $urls[0] ?? '', $caption);
                }

                $published = true;
            }

            if (!$published) {
                throw new \RuntimeException('No se encontraron plataformas válidas para publicar.');
            }

            $post->update(['status' => 'published', 'error_message' => null]);
        } catch (\Throwable $e) {
            $post->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            throw $e;
        }
    }
}
