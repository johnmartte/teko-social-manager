# Roadmap Tecnico Detallado

Desglosa las fases en tickets ejecutables con estimacion, dependencias y cambios exactos de codigo.

---

## FASE 1: BASE SEGURA (1-2 semanas)

Objetivo: No confiar en credenciales sociales de cliente, tenancy fuerte, autorizacion.

### Ticket 1.1: Crear tabla SocialCredential cifrada

Descripcion:
- Nueva tabla para guardar tokens IG y FB por usuario
- Cifrado en reposo con Encryptable
- Scoped por user_id

Cambios:
- Migration: create_social_credentials_table.php
- Model: SocialCredential.php con fillable/casts
- User hasMany SocialCredential

Estimacion: 4 horas
Dependencias: ninguna

```php
// Migration
Schema::create('social_credentials', [
    'id' => bigIncrements(),
    'user_id' => foreignId('users', 'id')->cascadeOnDelete(),
    'platform' => enum('instagram', 'facebook'),
    'access_token' => text(), // encrypted
    'refresh_token' => text()->nullable(), // encrypted
    'expira_en' => timestamp()->nullable(),
    'metadata' => json()->nullable(),
    'timestamps',
]);

// Model
class SocialCredential extends Model {
    protected $fillable = ['platform', 'access_token', 'refresh_token', 'expira_en', 'metadata'];
    protected $encrypted = ['access_token', 'refresh_token'];
    protected $casts = ['expira_en' => 'datetime', 'metadata' => 'json'];
    function user() { return belongsTo(User::class); }
}
```

### Ticket 1.2: Refactor AuthController para guardar credenciales seguro

Descripcion:
- En callback OAuth, mover credenciales a tabla SocialCredential
- No guardar ni pasar por header

Cambios:
- AuthController callback() para crear SocialCredential
- Eliminar header de tokens en respuesta OAuth

Estimacion: 6 horas
Dependencias: 1.1

### Ticket 1.3: Middleware nuevo: ResolveSocialCredentials

Descripcion:
- Middleware que busca credencial desde user_id autenticado
- NO desde headers

Cambios:
- Nuevo middleware ResolveSocialCredentials.php
- Aplica a rutas Instagram/Facebook
- Resuelve credential server-side

Estimacion: 4 horas
Dependencias: 1.1, 1.2

### Ticket 1.4: Agregar workspace_id y user_id a tablas operativas

Descripcion:
- InboxConversation
- QuickReplyTemplate
- AutomationRule
- ScheduledPost

Cambios:
- Migration alter add workspace_id, user_id
- Seed datos segun user autenticado
- Queries scoped por workspace/user

Estimacion: 8 horas
Dependencias: ninguna (paralela)

### Ticket 1.5: Policies y autorizacion

Descripcion:
- ScheduledPostPolicy
- InboxConversationPolicy
- Template/AutomationPolicy

Cambios:
- Policies php artisan make:policy X
- Metodos view/create/update/delete
- Chequeos en controllers con authorize()

Estimacion: 6 horas
Dependencias: 1.4

### Ticket 1.6: Tests basicos de seguridad

Descripcion:
- User A no puede ver posts de User B
- Token vencido rechazado
- Endpoint sin autenticacion rechazado

Cambios:
- Feature tests en tests/Feature/
- Casos: auth fallida, cross-tenant access, expiracion token

Estimacion: 6 horas
Dependencias: 1.3, 1.4, 1.5

**Fase 1 Total: 34 horas**

---

## FASE 2: FIABILIDAD DEL SCHEDULER (2-4 semanas)

Objetivo: Publicacion robusta sin dobles, retry inteligente, observabilidad.

### Ticket 2.1: Job por publicacion con queue

Descripcion:
- Crear Job PublishScheduledPost
- Cola database por defecto, redis en prod
- Lógica de publish en job, no en comando

Cambios:
- Job: app/Jobs/PublishScheduledPost.php
- Comando: publica scheduled_posts, enqueue en lugar de sync
- config/queue.php: redis en prod

Estimacion: 6 horas
Dependencias: 1.1-1.3

```php
// Job
class PublishScheduledPost implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public ScheduledPost $post) {}

    public function handle(MetaApiService $meta) {
        // Logica de publish aca
        // Update status a 'published' o 'failed'
    }
}
```

### Ticket 2.2: Idempotencia y locking

Descripcion:
- No publicar dos veces un post bajo concurrencia
- Lock transaccional de DB
- Cambio de status atomico

Cambios:
- Metodo post->attemptPublish() con lockForUpdate
- evento published/failed
- Historial de intentos

Estimacion: 8 horas
Dependencias: 2.1

```php
public function handle() {
    $post = ScheduledPost::lockForUpdate()->find($this->post->id);
    if ($post->status !== 'pending') {
        return; // Ya publicado o procesado
    }

    $post->update(['status' => 'processing']);
    // ... publish logic
}
```

### Ticket 2.3: Retry y backoff por tipo de error

Descripcion:
- Token expirado => retry con token nuevamente
- Rate limit => retry exponencial
- Media no disponible => fail

Cambios:
- failed_jobs tabla para fallidos
- Logica de retry por exception type
- MaxAttempts = 3

Estimacion: 8 horas
Dependencias: 2.1, 2.2

### Ticket 2.4: Historial de intentos de publicacion

Descripcion:
- Tabla PublishAttempt para auditoria
- Timestamp, status, error, retry_count

Cambios:
- Migration: create_publish_attempts_table.php
- Model: PublishAttempt.php
- Al fallar, guardar intento

Estimacion: 4 horas
Dependencias: 2.1

### Ticket 2.5: Dashboard de scheduler (backend)

Descripcion:
- Endpoint GET /api/workspace/scheduler-status
- Errores recientes, posts en cola, tasa de exito

Cambios:
- WorkspaceController: schedulerStatus()
- Query: PublishAttempt, failed_jobs
- Agregacion por periodo

Estimacion: 6 horas
Dependencias: 2.4

### Ticket 2.6: Frontend: panel de errores del scheduler

Descripcion:
- Nueva pagina o seccion en dashboard
- Muestra posts fallidos con detalle de error
- Boton reintento manual

Cambios:
- frontend/src/app/scheduler-errors/page.tsx
- Hook para traer errores
- Componente de reintento

Estimacion: 4 horas
Dependencias: 2.5

### Ticket 2.7: Tests del scheduler

Descripcion:
- Mismo post no se publica dos veces
- Retry funciona
- Tokens expirados detectados

Cambios:
- tests/Feature/ScheduledPostTest.php
- Casos: concurrencia, retry, token expirado

Estimacion: 8 horas
Dependencias: 2.1-2.6

**Fase 2 Total: 44 horas**

---

## FASE 3: INTELIGENCIA Y AUTOMATIZACION (4-8 semanas)

Objetivo: Productividad + rendimiento mejorado.

### Ticket 3.1: Smart Scheduler - Recomendador de horarios

Descripcion:
- Analiza historico de insights IG/FB
- Ranking de franjas horarias por engagement
- API recomendacion de horario para tipo de contenido

Cambios:
- Model: SchedulingMetric (por user, net, franja, engagement)
- Service: SchedulerAnalyzer
- Endpoint: POST /api/workspace/recommend-schedule

Estimacion: 12 horas
Dependencias: 1.1-1.3

```php
// Service
public function recommendTime($userId, $platform, $type = 'photo') {
    $best = SchedulingMetric::where('user_id', $userId)
        ->where('platform', $platform)
        ->where('type', $type)
        ->orderByDesc('avg_engagement')
        ->first();
    return $best?->hour_slot;
}
```

### Ticket 3.2: Smart Scheduler - Generador de captions

Descripcion:
- Plantillas por objetivo (awareness, conversion, support)
- Reescritura por tono
- Auto-hashtags

Cambios:
- Model: CaptionTemplate.php
- Service: CaptionGenerator.php
- Endpoint: POST /api/captions/generate

Estimacion: 16 horas
Dependencias: 1.1

### Ticket 3.3: Moderacion inteligente de comentarios

Descripcion:
- Clasificar: spam, toxicidad, compra, soporte urgente
- Score 0-1 por tipo
- Cola priorizada + auto-hide segun umbral

Cambios:
- Model: CommentAnalysis.php
- Service: CommentClassifier.php (integracion NLP simple o libreria)
- Comando: AnalyzeComments
- Endpoint: GET /instagram/media/{id}/comments/analyzed

Estimacion: 20 horas
Dependencias: 1.1-1.3

### Ticket 3.4: Inbox Copilot

Descripcion:
- Sugerencia de respuesta contextual
- Deteccion de urgencia y escalamiento automatico
- SLA tracking

Cambios:
- Model: ConversationSuggestion.php
- Service: ResponseSuggester.php
- Enhancer de InboxConversation

Estimacion: 12 horas
Dependencias: 1.1

### Ticket 3.5: Alertas de anomalias

Descripcion:
- Monitoreo de metricas IG/FB
- Alertas si caida >20% o subida >50% en alcance/engagement
- Email/dashboard

Cambios:
- Model: MetricAlert.php
- Comando: DetectAnomalies
- Mailer: AnomalyNotification
- Endpoint: GET /api/workspace/anomaly-alerts

Estimacion: 12 horas
Dependencias: 1.1-1.3

### Ticket 3.6: Tests de inteligencia

Descripcion:
- Smart scheduler elige horario correcto
- Comentario spam detectado
- Anomalia identificada

Cambios:
- tests/Feature/SmartSchedulerTest.php
- tests/Feature/CommentClassifierTest.php

Estimacion: 10 horas
Dependencias: 3.1-3.5

**Fase 3 Total: 82 horas (pueden ir en paralelo)**

---

## Cronograma sugerido

Semana 1 (Sprint A):
- Tickets 1.1 - 1.3 (seguridad basica)

Semana 2 (Sprint B):
- Tickets 1.4 - 1.6 (multiusuario y tests)

Semana 3-4 (Sprint C):
- Tickets 2.1 - 2.4 (scheduler robusto)

Semana 5 (Sprint D):
- Tickets 2.5 - 2.7 (observabilidad scheduler)

Semana 6-8 (Sprint E-F):
- Tickets 3.1 - 3.6 (inteligencia, en paralelo)

**Total: 8-10 semanas para producto de nivel produccion completo.**

---

## Riesgos y mitigaciones

Riesgo: Token vencido durante refactor
Mitigacion: Mantener fallback a header token hasta 1.3 completo

Riesgo: Doble publicacion en 2.1-2.2
Mitigacion: Lock transaccional desde inicio

Riesgo: NLP en 3.3 lento
Mitigacion: Cola asincrona, no en sync

---

## Metricas de exito

Fase 1: 0 accesos cross-tenant detectados en logs
Fase 2: 0 dobles publicaciones en 1 mes, 95%+ success rate
Fase 3: 30% menos tiempo operativo, 20%+ engagement vs manual
