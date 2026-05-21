<?php

namespace App\Http\Controllers;

use App\Services\MetaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class InstagramController extends Controller
{
    public function __construct(
        private MetaApiService $meta,
    ) {}

    public function profile(Request $request): JsonResponse
    {
        return response()->json(
            $this->meta->getInstagramProfile($request->attributes->get('ig_user_id'), $request->attributes->get('ig_token'))
        );
    }

    public function media(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 12);

        return response()->json(
            $this->meta->getInstagramMedia($request->attributes->get('ig_user_id'), $request->attributes->get('ig_token'), $limit)
        );
    }

    public function insights(Request $request): JsonResponse
    {
        $period = $request->input('period', 'day');
        $days = (int) $request->input('days', 28);

        try {
            $data = $this->meta->getInstagramInsights($request->attributes->get('ig_user_id'), $request->attributes->get('ig_token'), $period, $days);
            return response()->json($data);
        } catch (\Throwable $e) {
            \Log::error('Instagram insights error: ' . $e->getMessage());
            return response()->json(['data' => [], 'error' => $e->getMessage()]);
        }
    }

    public function audience(Request $request): JsonResponse
    {
        return response()->json(
            $this->meta->getInstagramAudience($request->attributes->get('ig_user_id'), $request->attributes->get('ig_token'))
        );
    }

    public function onlineFollowers(Request $request): JsonResponse
    {
        return response()->json(
            $this->meta->getInstagramOnlineFollowers($request->attributes->get('ig_user_id'), $request->attributes->get('ig_token'))
        );
    }

    /**
     * Debug endpoint — returns raw API responses + account info to diagnose demographics.
     */
    public function debugAudience(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('ig_user_id');
        $token = $request->attributes->get('ig_token');

        // 1. Get account info — try different field combos
        $profileResponse = \Illuminate\Support\Facades\Http::get("https://graph.facebook.com/v20.0/{$userId}", [
            'fields' => 'id,username,name,followers_count,media_count,biography',
            'access_token' => $token,
        ]);
        $profileRaw = $profileResponse->json();

        // Also get the profile via the service for comparison
        $profileViaService = \Illuminate\Support\Facades\Http::get("https://graph.facebook.com/v20.0/{$userId}", [
            'fields' => 'id,username',
            'access_token' => $token,
        ])->json();

        // 2. Check token permissions
        $tokenDebug = \Illuminate\Support\Facades\Http::get("https://graph.facebook.com/v20.0/me/permissions", [
            'access_token' => $token,
        ]);

        // 3. Check token info
        $tokenInfo = \Illuminate\Support\Facades\Http::get("https://graph.facebook.com/v20.0/debug_token", [
            'input_token' => $token,
            'access_token' => $token,
        ])->json();

        // 3. Test all demographic metric combos
        $attempts = [
            ['metric' => 'follower_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'breakdown' => 'age,gender'],
            ['metric' => 'follower_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'breakdown' => 'country'],
            ['metric' => 'reached_audience_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'timeframe' => 'this_month', 'breakdown' => 'age,gender'],
            ['metric' => 'reached_audience_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'timeframe' => 'this_week', 'breakdown' => 'age,gender'],
            ['metric' => 'engaged_audience_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'timeframe' => 'this_month', 'breakdown' => 'age,gender'],
            ['metric' => 'engaged_audience_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'timeframe' => 'this_week', 'breakdown' => 'age,gender'],
        ];

        $results = [];
        foreach ($attempts as $params) {
            $response = \Illuminate\Support\Facades\Http::get("https://graph.facebook.com/v20.0/{$userId}/insights", array_merge($params, ['access_token' => $token]));
            $results[] = [
                'params' => $params,
                'status' => $response->status(),
                'has_data' => !empty($response->json('data')),
                'response' => $response->json(),
            ];
        }

        return response()->json([
            'user_id' => $userId,
            'token_first_10' => substr($token, 0, 10) . '...',
            'profile' => $profileRaw,
            'profile_minimal' => $profileViaService,
            'token_info' => $tokenInfo,
            'permissions' => $tokenDebug->json(),
            'demographic_tests' => $results,
        ]);
    }

    public function mediaInsights(Request $request, string $mediaId): JsonResponse
    {
        return response()->json(
            $this->meta->getMediaInsights($mediaId, $request->attributes->get('ig_token'))
        );
    }

    public function publishPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'image_url' => 'required|url',
            'caption' => 'nullable|string|max:2200',
        ]);

        try {
            return response()->json(
                $this->meta->publishPhoto(
                    $request->attributes->get('ig_user_id'),
                    $request->attributes->get('ig_token'),
                    $request->input('image_url'),
                    (string) $request->input('caption', ''),
                )
            );
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function publishReel(Request $request): JsonResponse
    {
        $request->validate([
            'video_url' => 'required|url',
            'caption' => 'nullable|string|max:2200',
        ]);

        try {
            return response()->json(
                $this->meta->publishReel(
                    $request->attributes->get('ig_user_id'),
                    $request->attributes->get('ig_token'),
                    $request->input('video_url'),
                    (string) $request->input('caption', ''),
                )
            );
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function publishCarousel(Request $request): JsonResponse
    {
        $request->validate([
            'image_urls' => 'required|array|min:2|max:10',
            'image_urls.*' => 'required|url',
            'caption' => 'nullable|string|max:2200',
        ]);

        try {
            return response()->json(
                $this->meta->publishCarousel(
                    $request->attributes->get('ig_user_id'),
                    $request->attributes->get('ig_token'),
                    $request->input('image_urls'),
                    (string) $request->input('caption', ''),
                )
            );
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function comments(Request $request, string $mediaId): JsonResponse
    {
        return response()->json(
            $this->meta->getComments($mediaId, $request->attributes->get('ig_token'))
        );
    }

    public function replyToComment(Request $request, string $mediaId): JsonResponse
    {
        $request->validate(['message' => 'required|string']);

        return response()->json(
            $this->meta->replyToComment($mediaId, $request->attributes->get('ig_token'), $request->input('message'))
        );
    }

    public function hideComment(Request $request, string $commentId): JsonResponse
    {
        $hide = $request->input('hide', true);

        return response()->json(
            $this->meta->hideComment($commentId, $request->attributes->get('ig_token'), $hide)
        );
    }

    public function deleteComment(Request $request, string $commentId): JsonResponse
    {
        return response()->json(
            $this->meta->deleteComment($commentId, $request->attributes->get('ig_token'))
        );
    }

    // ─── MESSAGING ──────────────────────────────────────

    public function conversations(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 50);
        $userId = $request->attributes->get('ig_user_id');
        $token = $request->attributes->get('ig_token');

        try {
            $data = $this->meta->getInstagramConversations($userId, $token, $limit);
            return response()->json($data);
        } catch (Throwable $e) {
            return response()->json(['data' => [], 'error' => $e->getMessage()]);
        }
    }

    public function conversationMessages(Request $request, string $conversationId): JsonResponse
    {
        try {
            $data = $this->meta->getConversationMessages(
                $conversationId,
                $request->attributes->get('ig_token')
            );
            return response()->json($data);
        } catch (Throwable $e) {
            return response()->json(['messages' => [], 'error' => $e->getMessage()]);
        }
    }

    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'recipient_id' => 'required|string',
            'message' => 'required|string|max:1000',
        ]);

        try {
            $data = $this->meta->sendInstagramMessage(
                $request->attributes->get('ig_user_id'),
                $request->attributes->get('ig_token'),
                $request->input('recipient_id'),
                $request->input('message')
            );
            return response()->json($data);
        } catch (Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
