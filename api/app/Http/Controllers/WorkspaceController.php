<?php

namespace App\Http\Controllers;

use App\Models\AutomationRule;
use App\Models\InboxConversation;
use App\Models\QuickReplyTemplate;
use App\Models\ScheduledPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $pending = ScheduledPost::query()->where('status', 'pending')->count();
        $published = ScheduledPost::query()->where('status', 'published')->count();

        $tasks = ScheduledPost::query()
            ->where('status', 'pending')
            ->orderBy('scheduled_at')
            ->limit(6)
            ->get()
            ->map(function (ScheduledPost $post) {
                return [
                    'id' => (string) $post->id,
                    'title' => $post->caption ?: 'Publicar ' . $post->type . ' en ' . $post->platform,
                    'owner' => 'Sistema',
                    'tag' => $post->platform === 'instagram' ? 'Contenido' : 'Comunidad',
                    'due' => optional($post->scheduled_at)->format('H:i') ?: '--:--',
                ];
            })
            ->values();

        $completion = ($pending + $published) > 0
            ? (int) (($published * 100) / ($pending + $published))
            : 0;

        $openConversations = InboxConversation::query()
            ->where('is_resolved', false)
            ->get(['created_at', 'last_activity_at']);

        $avgResponseMinutes = 19;
        if ($openConversations->count() > 0) {
            $totalMinutes = $openConversations
                ->map(function (InboxConversation $conversation) {
                    $end = $conversation->last_activity_at ?: now();
                    return $conversation->created_at->diffInMinutes($end);
                })
                ->sum();

            $avgResponseMinutes = (int) ($totalMinutes / $openConversations->count());
        }

        return response()->json([
            'tasks' => $tasks,
            'metrics' => [
                'completion' => $completion,
                'response_minutes' => $avgResponseMinutes < 0 ? 0 : $avgResponseMinutes,
            ],
            'quick_actions' => [
                [
                    'href' => '/publish',
                    'label' => 'Publicador multiformato',
                    'hint' => 'Foto, reel, carrusel y post',
                    'color' => '#e1306c',
                ],
                [
                    'href' => '/planner',
                    'label' => 'Planner editorial',
                    'hint' => 'Calendario y pipeline de contenido',
                    'color' => '#e8a126',
                ],
                [
                    'href' => '/inbox',
                    'label' => 'Inbox unificado',
                    'hint' => 'Mensajes y menciones en una vista',
                    'color' => '#1877f2',
                ],
                [
                    'href' => '/automations',
                    'label' => 'Automatizaciones',
                    'hint' => 'Reglas para horario y moderacion',
                    'color' => '#22c55e',
                ],
            ],
        ]);
    }

    public function plannerMeta(): JsonResponse
    {
        return response()->json([
            'platforms' => [
                'instagram' => ['label' => 'Instagram', 'color' => '#e1306c'],
                'facebook' => ['label' => 'Facebook', 'color' => '#1877f2'],
                'both' => ['label' => 'Ambas', 'color' => '#7c3aed'],
            ],
            'statuses' => [
                'pending' => ['label' => 'Pendiente', 'color' => '#e8a126'],
                'published' => ['label' => 'Publicado', 'color' => '#22c55e'],
                'failed' => ['label' => 'Fallido', 'color' => '#ef4444'],
            ],
        ]);
    }

    public function inbox(): JsonResponse
    {
        $this->seedInboxDefaults();

        $conversations = InboxConversation::query()
            ->orderByDesc('last_activity_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (InboxConversation $conversation) {
                return [
                    'id' => (string) $conversation->id,
                    'channel' => $conversation->channel === 'instagram' ? 'Instagram' : 'Facebook',
                    'from' => $conversation->from_name,
                    'message' => $conversation->message,
                    'level' => match ($conversation->priority_level) {
                        'alta' => 'Alta',
                        'media' => 'Media',
                        default => 'Baja',
                    },
                    'age' => $conversation->last_activity_at
                        ? $conversation->last_activity_at->diffForHumans()
                        : $conversation->created_at->diffForHumans(),
                ];
            })
            ->values();

        $templates = QuickReplyTemplate::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->pluck('content')
            ->values();

        return response()->json([
            'conversations' => $conversations,
            'templates' => $templates,
        ]);
    }

    public function addTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'min:4', 'max:500'],
        ]);

        $template = QuickReplyTemplate::create([
            'content' => $validated['content'],
            'is_active' => true,
        ]);

        return response()->json(['template' => $template], 201);
    }

    public function automations(): JsonResponse
    {
        $this->seedAutomationDefaults();

        $rules = AutomationRule::query()->orderBy('id')->get()->map(function (AutomationRule $rule) {
            return [
                'id' => (string) $rule->id,
                'name' => $rule->name,
                'description' => $rule->description,
                'enabled' => $rule->enabled,
            ];
        })->values();

        $activeRules = AutomationRule::query()->where('enabled', true)->count();
        $pendingPosts = ScheduledPost::query()->where('status', 'pending')->count();
        $operationalSavingsHours = (string) (($activeRules * 17) / 10);
        $responseReduction = $activeRules * 7;
        if ($responseReduction > 40) {
            $responseReduction = 40;
        }

        $crisisReduction = (int) (($pendingPosts * 8) / 10) + ($activeRules * 5);
        if ($crisisReduction > 60) {
            $crisisReduction = 60;
        }

        return response()->json([
            'rules' => $rules,
            'impact' => [
                'operational_savings_hours' => $operationalSavingsHours,
                'response_time_reduction_percent' => $responseReduction,
                'crisis_risk_reduction_percent' => $crisisReduction,
            ],
        ]);
    }

    public function toggleAutomation(AutomationRule $automationRule): JsonResponse
    {
        $automationRule->enabled = !$automationRule->enabled;
        $automationRule->save();

        return response()->json([
            'rule' => [
                'id' => (string) $automationRule->id,
                'name' => $automationRule->name,
                'description' => $automationRule->description,
                'enabled' => $automationRule->enabled,
            ],
        ]);
    }

    private function seedInboxDefaults(): void
    {
        if (InboxConversation::query()->exists()) {
            return;
        }

        InboxConversation::query()->insert([
            [
                'channel' => 'instagram',
                'from_name' => '@sara.m',
                'message' => 'Hola, tienen stock del modelo rojo?',
                'priority_level' => 'alta',
                'is_resolved' => false,
                'last_activity_at' => now()->subMinutes(3),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'channel' => 'facebook',
                'from_name' => 'Camilo Reyes',
                'message' => 'No puedo completar el checkout, me ayudan?',
                'priority_level' => 'alta',
                'is_resolved' => false,
                'last_activity_at' => now()->subMinutes(8),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        QuickReplyTemplate::query()->insert([
            ['content' => 'Gracias por escribirnos, te ayudamos en un momento.', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['content' => 'Aqui tienes el enlace directo con toda la informacion.', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['content' => 'Perfecto, ya escalamos tu caso al equipo de soporte.', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    private function seedAutomationDefaults(): void
    {
        if (AutomationRule::query()->exists()) {
            return;
        }

        $defaults = [
            [
                'key' => 'smart-publish',
                'name' => 'Publicacion inteligente',
                'description' => 'Sugiere hora de posteo segun rendimiento de las ultimas 4 semanas.',
                'enabled' => true,
            ],
            [
                'key' => 'comment-moderation',
                'name' => 'Moderacion automatica',
                'description' => 'Marca comentarios con spam o lenguaje toxico para revision rapida.',
                'enabled' => true,
            ],
            [
                'key' => 'support-escalation',
                'name' => 'Escalamiento de soporte',
                'description' => 'Cuando un mensaje incluye palabras clave, lo envia a prioridad alta.',
                'enabled' => false,
            ],
            [
                'key' => 'daily-summary',
                'name' => 'Resumen ejecutivo diario',
                'description' => 'Genera un resumen de KPIs y actividad de comunidad al final del dia.',
                'enabled' => true,
            ],
        ];

        foreach ($defaults as $row) {
            AutomationRule::query()->create($row);
        }
    }
}
