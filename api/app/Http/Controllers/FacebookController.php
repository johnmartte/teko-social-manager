<?php

namespace App\Http\Controllers;

use App\Services\MetaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacebookController extends Controller
{
    public function __construct(
        private MetaApiService $meta,
    ) {}

    public function pages(): JsonResponse
    {
        return response()->json(
            $this->meta->getFacebookPages(session('fb_token'))
        );
    }

    public function pageInfo(): JsonResponse
    {
        return response()->json(
            $this->meta->getPageInfo(session('fb_page_id'), session('fb_token'))
        );
    }

    public function posts(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 10);

        return response()->json(
            $this->meta->getPagePosts(session('fb_page_id'), session('fb_token'), $limit)
        );
    }

    public function publishPost(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'link' => 'nullable|url',
        ]);

        return response()->json(
            $this->meta->publishPagePost(
                session('fb_page_id'),
                session('fb_token'),
                $request->input('message'),
                $request->input('link'),
            )
        );
    }

    public function publishPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'image_url' => 'required|url',
            'caption' => 'nullable|string',
        ]);

        return response()->json(
            $this->meta->publishPagePhoto(
                session('fb_page_id'),
                session('fb_token'),
                $request->input('image_url'),
                $request->input('caption', ''),
            )
        );
    }

    public function insights(Request $request): JsonResponse
    {
        $period = $request->input('period', 'day');

        return response()->json(
            $this->meta->getPageInsights(session('fb_page_id'), session('fb_token'), $period)
        );
    }

    public function deletePost(string $postId): JsonResponse
    {
        return response()->json(
            $this->meta->deletePost($postId, session('fb_token'))
        );
    }
}
