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

    public function pages(Request $request): JsonResponse
    {
        return response()->json(
            $this->meta->getFacebookPages($request->attributes->get('fb_token'))
        );
    }

    public function pageInfo(Request $request): JsonResponse
    {
        return response()->json(
            $this->meta->getPageInfo($request->attributes->get('fb_page_id'), $request->attributes->get('fb_token'))
        );
    }

    public function posts(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 10);

        return response()->json(
            $this->meta->getPagePosts($request->attributes->get('fb_page_id'), $request->attributes->get('fb_token'), $limit)
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
                $request->attributes->get('fb_page_id'),
                $request->attributes->get('fb_token'),
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
                $request->attributes->get('fb_page_id'),
                $request->attributes->get('fb_token'),
                $request->input('image_url'),
                $request->input('caption', ''),
            )
        );
    }

    public function insights(Request $request): JsonResponse
    {
        $period = $request->input('period', 'day');

        return response()->json(
            $this->meta->getPageInsights($request->attributes->get('fb_page_id'), $request->attributes->get('fb_token'), $period)
        );
    }

    public function deletePost(Request $request, string $postId): JsonResponse
    {
        return response()->json(
            $this->meta->deletePost($postId, $request->attributes->get('fb_token'))
        );
    }
}
