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

        return response()->json(
            $this->meta->getInstagramInsights($request->attributes->get('ig_user_id'), $request->attributes->get('ig_token'), $period)
        );
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
}
