<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov|max:102400',
        ]);

        $file = $request->file('file');

        // ── Try imgbb for images (Instagram needs a CDN URL) ────────────
        $imgbbKey = config('services.imgbb.api_key');
        $isImage = str_starts_with($file->getMimeType(), 'image/');

        if ($imgbbKey && $isImage) {
            $base64 = base64_encode(file_get_contents($file->getRealPath()));

            $response = Http::asForm()->post('https://api.imgbb.com/1/upload', [
                'key' => $imgbbKey,
                'image' => $base64,
                'name' => Str::uuid()->toString(),
            ]);

            $data = $response->json();

            if ($response->ok() && !empty($data['data']['url'])) {
                return response()->json(['url' => $data['data']['url']]);
            }

            // Fall through to local storage if imgbb fails
        }

        // ── Fallback: store locally ─────────────────────────────────────
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        $dir = is_dir('/data') ? '/data/uploads' : database_path('uploads');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $file->move($dir, $filename);

        $baseUrl = config('app.url');
        if (!$baseUrl || $baseUrl === 'http://localhost') {
            $host = $request->header('X-Forwarded-Host')
                 ?? $request->header('Host')
                 ?? $request->getHost();
            $scheme = $request->header('X-Forwarded-Proto', 'https');
            $baseUrl = "{$scheme}://{$host}";
        }
        $url = rtrim($baseUrl, '/') . '/uploads/' . $filename;

        return response()->json(['url' => $url]);
    }

    public function serve(string $filename)
    {
        $dir = is_dir('/data') ? '/data/uploads' : database_path('uploads');
        $path = $dir . '/' . basename($filename);

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Content-Type' => mime_content_type($path),
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }
}
