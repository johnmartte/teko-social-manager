<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov|max:102400',
        ]);

        $file = $request->file('file');
        $path = $file->store('uploads', 'public');

        $url = $request->getSchemeAndHttpHost() . '/storage/' . $path;

        return response()->json(['url' => $url]);
    }
}
