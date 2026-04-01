# Teko Social Manager

Guia completa para implementar, escalar y operar el sistema de forma segura.

## 1. Estado actual del sistema

Teko Social Manager es una plataforma para gestionar Instagram y Facebook desde un panel unificado.

Stack actual:
- Frontend: Next.js 16, React 19, TypeScript, Tailwind v4
- Backend: Laravel 13, Sanctum
- Base de datos: SQLite (dev), compatible con MySQL/PostgreSQL para produccion
- Integraciones: Meta Graph API (Instagram/Facebook), Cloudinary
- Deploy actual: Frontend en Vercel, Backend en Railway

Capacidades ya implementadas:
- Login de sistema (email/password)
- Conexion social Meta
- Publicacion inmediata (IG y FB)
- Programacion de publicaciones
- Planner con publicacion manual y borrado masivo
- Inbox unificado con templates
- Reglas de automatizacion (toggle)
- Insights basicos IG/FB

---

## 2. Arquitectura recomendada

## 2.1 Backend (Laravel)

Capas:
- Controllers: entrada/salida HTTP
- Services: logica de negocio e integraciones externas
- Models: persistencia
- Jobs/Queues: tareas asincronas
- Middleware: autenticacion/autorizacion

Rutas principales:
- Auth sistema: api/auth/system/*
- Workspace: api/workspace/*
- Instagram: api/instagram/*
- Facebook: api/facebook/*
- Scheduler: api/scheduled-posts*

## 2.2 Frontend (Next.js)

Bloques:
- App Router para paginas
- AuthContext para sesion de sistema
- lib/api para llamadas al backend
- UI pages: dashboard, publish, planner, inbox, automations, insights, settings

---

## 3. Setup local completo

## 3.1 Requisitos

- Node 20+
- npm 10+
- PHP 8.4+
- Composer 2+
- SQLite o MySQL/PostgreSQL

## 3.2 Backend

1. Entrar a carpeta api
2. Instalar dependencias
3. Crear .env
4. Generar key
5. Migrar base de datos
6. Levantar servidor

Comandos:

```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

## 3.3 Frontend

Comandos:

```bash
cd frontend
npm install
npm run dev
```

---

## 4. Variables de entorno

## 4.1 Backend (.env)

Base:
- APP_ENV=local
- APP_DEBUG=true
- APP_URL=http://127.0.0.1:8000
- FRONTEND_URL=http://localhost:3000

DB:
- DB_CONNECTION=sqlite

Sanctum/CORS:
- SESSION_DRIVER=database
- SANCTUM_STATEFUL_DOMAINS=localhost:3000
- CORS_ALLOWED_ORIGINS=http://localhost:3000

Meta:
- META_APP_ID=
- META_APP_SECRET=
- META_REDIRECT_URI=http://127.0.0.1:8000/auth/callback
- META_OAUTH_PROVIDER=instagram
- META_VERIFY_SSL=true

Cloudinary:
- CLOUDINARY_CLOUD_NAME=
- CLOUDINARY_UPLOAD_PRESET=

Queue:
- QUEUE_CONNECTION=database

## 4.2 Frontend (.env.local)

- NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

---

## 5. Despliegue productivo

## 5.1 Backend (Railway)

Checklist:
1. Variables de entorno completas
2. APP_ENV=production
3. APP_DEBUG=false
4. APP_KEY valida
5. QUEUE_CONNECTION=database (o redis)
6. Ejecutar migraciones en deploy
7. Worker de cola activo si se usan jobs
8. Task scheduler activo cada minuto

Comandos utiles:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan optimize
```

## 5.2 Frontend (Vercel)

Checklist:
1. NEXT_PUBLIC_API_URL apuntando a Railway
2. Build exitoso
3. Deploy en produccion

---

## 6. Seguridad obligatoria antes de escalar

## 6.1 Tokens sociales

Problema actual:
- El sistema acepta tokens sociales por headers del cliente.

Accion requerida:
- Mover credenciales sociales a almacenamiento seguro server-side por usuario/workspace.
- No confiar en tokens enviados por navegador para operaciones sensibles.

## 6.2 Multiusuario real

Problema actual:
- Datos de workspace (inbox/templates/rules) sin ownership fuerte.

Accion requerida:
- Agregar user_id o workspace_id a todas las tablas operativas.
- Aplicar filtros por tenant en todas las consultas.

## 6.3 OAuth

Problema actual:
- Riesgo al mover credenciales por query string en redirects.

Accion requerida:
- Usar intercambio seguro server-side y tokens de sesion de corta vida.

---

## 7. Fiabilidad operativa

## 7.1 Publicaciones programadas

Mejoras requeridas:
- Idempotencia por post
- Lock transaccional para evitar doble publicacion
- Retry/backoff segun tipo de error
- Historial de intentos con trazabilidad

## 7.2 Observabilidad

Agregar:
- Logs estructurados (request_id, user_id, post_id)
- Metricas de exito/fallo de publicacion
- Alertas por tasa de fallo alta

---

## 8. Funciones inteligentes a implementar

## 8.1 Smart Scheduler

- Recomendador de franjas horarias por red y tipo
- Ranking de horarios por engagement historico
- Simulador de plan semanal

## 8.2 Copiloto de contenido

- Generacion de captions por tono/objetivo
- Variantes A/B
- Sugerencias de hashtags por tema

## 8.3 Moderacion inteligente

- Clasificacion de comentarios (spam, toxicidad, compra, soporte)
- Priorizacion automatica
- Ocultado automatico con umbrales configurables

## 8.4 Inbox inteligente

- Sugerencias de respuesta contextual
- Auto-enrutamiento por intencion
- Escalamiento automatico con SLA

## 8.5 Alertas de anomalias

- Caidas/subidas fuera de patron en alcance y engagement
- Alertas por canal (email, dashboard)

---

## 9. Automatizaciones recomendadas

Nivel 1 (rapidas):
- Reintento automatico de posts fallidos
- Recordatorios de slots vacios
- Resumen diario de actividad

Nivel 2 (operativas):
- Auto-prioridad en inbox por palabras clave
- Auto-respuesta para FAQs
- Auto-tag de conversaciones

Nivel 3 (inteligentes):
- Sugerencia automatica de hora y formato
- Prediccion simple de rendimiento semanal

---

## 10. Roadmap de implementacion por fases

## Fase 1 (1-2 semanas) - Base segura

Objetivo:
- Blindar seguridad y tenancy.

Tareas:
1. Modelo SocialCredential cifrado por usuario
2. Refactor de middlewares para resolver credenciales server-side
3. Agregar user_id/workspace_id a tablas operativas
4. Polices/autorizacion por recurso
5. Tests feature minimos de auth/schedule

Definition of done:
- Ningun endpoint sensible depende de token social enviado por cliente.

## Fase 2 (2-4 semanas) - Fiabilidad

Objetivo:
- Publicacion programada robusta.

Tareas:
1. Job por publicacion con cola
2. Locking + idempotencia
3. Retry/backoff por error
4. Panel de errores de scheduler

Definition of done:
- No hay doble publicacion bajo concurrencia.

## Fase 3 (4-8 semanas) - Inteligencia y automatizacion

Objetivo:
- Productividad y rendimiento.

Tareas:
1. Smart Scheduler v1
2. Inbox Copilot v1
3. Moderacion inteligente v1
4. Alertas de anomalias

Definition of done:
- Mejora medible en tiempo operativo y engagement.

---

## 11. KPIs para validar el avance

- Publish success rate
- Mean time to publish
- Tiempo medio de respuesta inbox
- Engagement por horario recomendado vs manual
- % de conversaciones auto-clasificadas correctamente
- % de fallos por token expirado
- Tiempo ahorrado por automatizaciones

---

## 12. Testing strategy

Backend:
- Feature tests: auth sistema, scheduled posts, workspace ownership
- Unit tests: servicios de reglas, normalizadores, scoring scheduler

Frontend:
- Component tests para formularios criticos
- Flujos E2E: login, programacion, inbox, insights

CI recomendado:
- Build frontend
- PHPUnit backend
- Lint frontend
- Smoke tests de rutas principales

---

## 13. Convenciones recomendadas

- Todo endpoint nuevo con validacion Request dedicada
- Sin logica compleja en controllers
- Servicios puros para negocio
- Mensajes de error estandarizados
- Sin strings hardcode en UI (usar metadata API)

---

## 14. Plan de ejecucion inmediato sugerido

Sprint A (arrancar ya):
1. SocialCredential seguro + migracion de tokens
2. Scoping multiusuario en tablas workspace
3. Tests de seguridad y autorizacion

Sprint B:
1. Scheduler robusto con jobs
2. Dashboard de fallos/reintentos

Sprint C:
1. Smart Scheduler v1
2. Inbox Copilot v1

---

## 15. Nota importante

Este README esta pensado como guia de implementacion real para evolucionar el producto a nivel produccion/escala.
Si quieres, el siguiente paso es convertir este plan en backlog tecnico (tickets) con estimacion por tarea, riesgo y orden exacto de ejecucion.
