<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Campaign::withCount('posts')->orderBy('starts_on')->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Campaign::create($this->validated($request)), 201);
    }

    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        $campaign->update($this->validated($request, partial: true));
        return response()->json($campaign);
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        $campaign->delete(); // los posts quedan sin campaña (nullOnDelete)
        return response()->json(['success' => true]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'        => "$req|string|max:120",
            'color'       => ['sometimes', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'description' => 'nullable|string|max:2000',
            'profile_name' => 'nullable|string|max:120',
            'profile_bio' => 'nullable|string|max:150',
            'profile_website' => 'nullable|url|max:500',
            'starts_on'   => 'nullable|date',
            'ends_on'     => 'nullable|date|after_or_equal:starts_on',
        ]);
    }
}
