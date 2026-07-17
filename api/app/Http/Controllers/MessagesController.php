<?php

namespace App\Http\Controllers;

use App\Services\MetaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessagesController extends Controller
{
    public function __construct(private MetaApiService $meta) {}

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('socialCredentials');

        $igCred = $user->socialCredential('instagram');
        $fbCred = $user->socialCredential('facebook');

        $conversations = [];

        if ($igCred) {
            try {
                $igData = $this->meta->getInstagramConversations(
                    $igCred->meta_user_id,
                    $igCred->access_token,
                );
                foreach ($igData['data'] ?? [] as $conv) {
                    $lastMsg = $conv['messages']['data'][0] ?? null;
                    $participant = $this->resolveParticipant($conv['participants']['data'] ?? [], $igCred->meta_user_id);

                    $conversations[] = [
                        'id' => $conv['id'],
                        'channel' => 'instagram',
                        'participant_id' => $participant['id'] ?? null,
                        'participant_name' => $participant['name'] ?? $participant['username'] ?? 'Usuario',
                        'last_message' => $lastMsg['message'] ?? '',
                        'last_message_from' => $lastMsg['from']['name'] ?? $lastMsg['from']['username'] ?? '',
                        'updated_time' => $conv['updated_time'] ?? $lastMsg['created_time'] ?? null,
                    ];
                }
            } catch (\Throwable $e) {
                \Log::warning('IG conversations error: ' . $e->getMessage());
            }
        }

        if ($fbCred) {
            try {
                $fbData = $this->meta->getFacebookConversations(
                    $fbCred->meta_user_id,
                    $fbCred->access_token,
                );
                foreach ($fbData['data'] ?? [] as $conv) {
                    $lastMsg = $conv['messages']['data'][0] ?? null;
                    $participant = $this->resolveParticipant($conv['participants']['data'] ?? [], $fbCred->meta_user_id);

                    $conversations[] = [
                        'id' => $conv['id'],
                        'channel' => 'facebook',
                        'participant_id' => $participant['id'] ?? null,
                        'participant_name' => $participant['name'] ?? 'Usuario',
                        'last_message' => $lastMsg['message'] ?? $conv['snippet'] ?? '',
                        'last_message_from' => $lastMsg['from']['name'] ?? '',
                        'updated_time' => $conv['updated_time'] ?? null,
                        'unread_count' => $conv['unread_count'] ?? 0,
                    ];
                }
            } catch (\Throwable $e) {
                \Log::warning('FB conversations error: ' . $e->getMessage());
            }
        }

        usort($conversations, fn($a, $b) => strcmp($b['updated_time'] ?? '', $a['updated_time'] ?? ''));

        return response()->json(['conversations' => $conversations]);
    }

    public function messages(Request $request, string $conversationId): JsonResponse
    {
        $user = $request->user();
        $user->load('socialCredentials');
        $channel = $request->query('channel', 'instagram');

        try {
            if ($channel === 'instagram') {
                $cred = $user->socialCredential('instagram');
                if (!$cred) {
                    return response()->json(['error' => 'No autenticado con Instagram.'], 401);
                }
                $data = $this->meta->getConversationMessages($conversationId, $cred->access_token);
            } else {
                $cred = $user->socialCredential('facebook');
                if (!$cred) {
                    return response()->json(['error' => 'No autenticado con Facebook.'], 401);
                }
                $data = $this->meta->getFacebookMessages($conversationId, $cred->access_token);
            }

            $messages = [];
            $rawMessages = $data['messages']['data'] ?? $data['data'] ?? [];

            foreach ($rawMessages as $msg) {
                $attachments = [];
                foreach ($msg['attachments']['data'] ?? [] as $att) {
                    $attachments[] = [
                        'type' => $att['mime_type'] ?? $att['type'] ?? 'unknown',
                        'url' => $att['image_data']['url'] ?? $att['video_data']['url'] ?? $att['file_url'] ?? null,
                    ];
                }

                $messages[] = [
                    'id' => $msg['id'],
                    'message' => $msg['message'] ?? '',
                    'from_id' => $msg['from']['id'] ?? null,
                    'from_name' => $msg['from']['name'] ?? $msg['from']['username'] ?? '',
                    'created_time' => $msg['created_time'] ?? null,
                    'attachments' => $attachments,
                ];
            }

            $messages = array_reverse($messages);

            return response()->json(['messages' => $messages]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['required', 'string'],
            'channel' => ['required', 'in:instagram,facebook'],
            'recipient_id' => ['required', 'string'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $user->load('socialCredentials');

        try {
            if ($validated['channel'] === 'instagram') {
                $cred = $user->socialCredential('instagram');
                if (!$cred) {
                    return response()->json(['error' => 'No autenticado con Instagram.'], 401);
                }
                $result = $this->meta->sendInstagramMessage(
                    $cred->meta_user_id,
                    $cred->access_token,
                    $validated['recipient_id'],
                    $validated['message'],
                );
            } else {
                $cred = $user->socialCredential('facebook');
                if (!$cred) {
                    return response()->json(['error' => 'No autenticado con Facebook.'], 401);
                }
                $result = $this->meta->sendFacebookMessage(
                    $cred->meta_user_id,
                    $cred->access_token,
                    $validated['recipient_id'],
                    $validated['message'],
                );
            }

            return response()->json(['success' => true, 'result' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function resolveParticipant(array $participants, string $ownId): array
    {
        foreach ($participants as $p) {
            if (($p['id'] ?? '') !== $ownId) {
                return $p;
            }
        }
        return $participants[0] ?? [];
    }
}
