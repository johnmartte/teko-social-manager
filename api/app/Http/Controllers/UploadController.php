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

        // ── Cloudinary upload ───────────────────────────────────────────
        $cloudName = config('services.cloudinary.cloud_name');
        $uploadPreset = config('services.cloudinary.upload_preset');

        if (!$cloudName || !$uploadPreset) {
            return response()->json([
                'error' => 'Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET en las variables de entorno.',
            ], 500);
        }

        $isVideo = str_starts_with($file->getMimeType(), 'video/');
        $resourceType = $isVideo ? 'video' : 'image';

        $response = Http::attach(
            'file',
            file_get_contents($file->getRealPath()),
            $file->getClientOriginalName()
        )->post("https://api.cloudinary.com/v1_1/{$cloudName}/{$resourceType}/upload", [
            'upload_preset' => $uploadPreset,
        ]);

        $data = $response->json();

        if ($response->failed() || empty($data['secure_url'])) {
            $msg = $data['error']['message'] ?? 'Error al subir a Cloudinary';
            return response()->json(['error' => $msg], 500);
        }

        return response()->json(['url' => $data['secure_url']]);
    }
}
