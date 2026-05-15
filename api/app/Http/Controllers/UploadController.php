<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private function uploadsDir(): string
    {
        // Use persistent volume on Railway, fallback to database/uploads locally
        $dir = is_dir('/data') ? '/data/uploads' : database_path('uploads');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov|max:102400',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        $file->move($this->uploadsDir(), $filename);

        // Build public URL — use APP_URL, or reconstruct from proxy headers
        $baseUrl = config('app.url');
        if (!$baseUrl || $baseUrl === 'http://localhost') {
            // Behind Railway's proxy: use the forwarded host
            $host = $request->header('X-Forwarded-Host')
                 ?? $request->header('Host')
                 ?? $request->getHost();
            $scheme = $request->header('X-Forwarded-Proto', 'https');
            $baseUrl = "{$scheme}://{$host}";
        }
        $url = rtrim($baseUrl, '/') . '/api/uploads/' . $filename;

        return response()->json(['url' => $url]);
    }

    public function serve(string $filename)
    {
        $path = $this->uploadsDir() . '/' . basename($filename);

        if (!file_exists($path)) {
            abort(404);
        }

        $mime = mime_content_type($path);

        return response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }
}
