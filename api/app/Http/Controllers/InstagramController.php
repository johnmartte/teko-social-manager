<?php

namespace App\Http\Controllers;

use App\Services\MetaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstagramController extends Controller
{
    public function __construct(
        private MetaApiService $meta,
    ) {}

    public function profile(): JsonResponse
    {
        return response()->json(
            $this->meta->getInstagramProfile(session('ig_user_id'), session('ig_token'))
        );
    }

    public function media(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 12);

        return response()->json(
            $this->meta->getInstagramMedia(session('ig_user_id'), session('ig_token'), $limit)
        );
    }

    public function insights(Request $request): JsonResponse
    {
        $period = $request->input('period', 'day');

        return response()->json(
            $this->meta->getInstagramInsights(session('ig_user_id'), session('ig_token'), $period)
        );
    }

    public function mediaInsights(string $mediaId): JsonResponse
    {
        return response()->json(
            $this->meta->getMediaInsights($mediaId, session('ig_token'))
        );
    }

    public function publishPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'image_url' => 'required|url',
            'caption' => 'nullable|string|max:2200',
        ]);

        return response()->json(
            $this->meta->publishPhoto(
                session('ig_user_id'),
                session('ig_token'),
                $request->input('image_url'),
                $request->input('caption', ''),
            )
        );
    }

    public function publishReel(Request $request): JsonResponse
    {
        $request->validate([
            'video_url' => 'required|url',
            'caption' => 'nullable|string|max:2200',
        ]);

        return response()->json(
            $this->meta->publishReel(
                session('ig_user_id'),
                session('ig_token'),
                $request->input('video_url'),
                $request->input('caption', ''),
            )
        );
    }

    public function publishCarousel(Request $request): JsonResponse
    {
        $request->validate([
            'image_urls' => 'required|array|min:2|max:10',
            'image_urls.*' => 'required|url',
            'caption' => 'nullable|string|max:2200',
        ]);

        return response()->json(
            $this->meta->publishCarousel(
                session('ig_user_id'),
                session('ig_token'),
                $request->input('image_urls'),
                $request->input('caption', ''),
            )
        );
    }

    public function comments(string $mediaId): JsonResponse
    {
        return response()->json(
            $this->meta->getComments($mediaId, session('ig_token'))
        );
    }

    public function replyToComment(Request $request, string $mediaId): JsonResponse
    {
        $request->validate(['message' => 'required|string']);

        return response()->json(
            $this->meta->replyToComment($mediaId, session('ig_token'), $request->input('message'))
        );
    }

    public function hideComment(Request $request, string $commentId): JsonResponse
    {
        $hide = $request->input('hide', true);

        return response()->json(
            $this->meta->hideComment($commentId, session('ig_token'), $hide)
        );
    }

    public function deleteComment(string $commentId): JsonResponse
    {
        return response()->json(
            $this->meta->deleteComment($commentId, session('ig_token'))
        );
    }
}
