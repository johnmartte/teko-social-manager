<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class StorageController extends Controller
{
    /** Uso de la cuenta de Cloudinary (Admin API). Se cachea: Cloudinary solo lo actualiza periódicamente. */
    public function usage(): JsonResponse
    {
        $cloud = config('services.cloudinary.cloud_name');
        $key = config('services.cloudinary.api_key');
        $secret = config('services.cloudinary.api_secret');

        if (!$cloud || !$key || !$secret) {
            return response()->json(['configured' => false]);
        }

        $data = Cache::remember('cloudinary_usage', 600, function () use ($cloud, $key, $secret) {
            $res = Http::withBasicAuth($key, $secret)->timeout(10)->get("https://api.cloudinary.com/v1_1/{$cloud}/usage");

            return $res->successful() ? $res->json() : null;
        });

        if (!$data) {
            return response()->json(['configured' => true, 'error' => 'No se pudo consultar Cloudinary.'], 502);
        }

        $used = Arr::get($data, 'credits.usage');
        $limit = Arr::get($data, 'credits.limit');
        $percent = Arr::get($data, 'credits.used_percent') ?? ($limit ? round($used / $limit * 100, 1) : null);

        return response()->json([
            'configured' => true,
            'plan' => Arr::get($data, 'plan'),
            'credits_used' => $used,
            'credits_limit' => $limit,
            'used_percent' => $percent,
            'storage_bytes' => Arr::get($data, 'storage.usage'),
        ]);
    }
}
