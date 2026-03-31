# Teko Social Manager - Contexto de Desarrollo

## 🎯 Objetivo del Proyecto

Aplicación de gestión de redes sociales que permite conectar cuentas de Instagram Business y Facebook desde una interfaz unificada. Permite publicar contenido, gestionar comentarios y ver estadísticas.

**Stack Tecnológico:**
- **Frontend**: Next.js 16.2.1 (TypeScript, React 19.2.4) - Puerto 3000
- **Backend**: Laravel 13 (PHP 8.4) - Puerto 8000
- **Base de datos**: SQLite
- **OAuth**: Instagram Business Login (Meta API v20.0)

---

## 📋 Estado Actual (31/03/2026)

### ✅ Completado

1. **Infraestructura Backend**
   - Laravel 13 configurado con sesiones en base de datos
   - Rutas OAuth implementadas: `/auth/login` → `/auth/callback`
   - Servicio `MetaApiService` centralizado para todas las operaciones con Meta API
   - CORS configurado correctamente con `supports_credentials: true`
   - SSL verification toggle para desarrollo (`META_VERIFY_SSL=false`)

2. **Infraestructura Frontend**
   - Next.js App Router funcionando (puerto 3000)
   - Limpieza de caché `.next` que causaba 404 falsas
   - AuthContext para manejo de estado de autenticación
   - Componentes UI construidos: Sidebar, Header, Dashboard
   - API helper con soporte para credentials/cookies

3. **Configuración Meta/Instagram**
   - **App ID**: `1474947117151473` (Instagram-specific app)
   - **OAuth Endpoints**: 
     - Autorización: `https://www.instagram.com/oauth/authorize`
     - Token exchange: `https://api.instagram.com/oauth/access_token`
     - Long-lived token: `https://graph.instagram.com/access_token`
   - **Scopes válidos**:
     - `instagram_business_basic`
     - `instagram_business_content_publish`
     - `instagram_business_manage_comments`
     - `instagram_business_manage_messages`
     - `instagram_business_manage_insights`

4. **HTTPS Tunneling (Localtunnel)**
   - Configurado para exponer puerto 8000 con HTTPS
   - URL actual: `https://orange-yaks-greet.loca.lt` (puede cambiar si túnel se reinicia)
   - Redirect URI en Meta Dashboard debe coincidir exactamente

### 🔄 En Progreso

1. **OAuth Flow End-to-End**
   - Backend y Frontend listos
   - Falta: Usuario completar login en Instagram y permitir permisos
   - Posible bloqueante: Túnel localtunnel inestable (se cae ocasionalmente con 503)

2. **Validación de Endpoints**
   - Backend responde 200 en `/auth/login`
   - CORS headers presentes
   - Session cookies siendo generados
   - Falta: Probar callback completo con código de Instagram

### ❌ Problemas Conocidos

1. **Localtu túnel Inestable**
   - Ocasionalmente devuelve 503 "Tunnel Unavailable"
   - Solución temporal: Redondea nueva URL si falla
   - Alternativa considerada: migrar a ngrok (requiere autenticación)

2. **SSL Certificate Verification**
   - Windows PHP carece de CA bundle actualizado
   - Workaround: `META_VERIFY_SSL=false` en desarrollo
   - Producción: Debe ser `true` con certificados válidos

---

## 🔧 Configuración Actual

### `.env` Backend (api/.env)
```
APP_NAME="Teko Social Manager"
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=sqlite
SESSION_DRIVER=database

# Meta API
META_APP_ID=1474947117151473
META_APP_SECRET=6f3c804b6d94fdbeb66f9919a85e2e37
META_REDIRECT_URI=https://orange-yaks-greet.loca.lt/auth/callback  # ⚠️ CAMBIAR SI TÚNEL SE REINICIA
META_VERIFY_SSL=false

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Rutas Principales
- **Frontend**: http://localhost:3000
- **Backend (local)**: http://localhost:8000
- **Backend (HTTPS)**: https://orange-yaks-greet.loca.lt
- **OAuth Authorization Endpoint**: https://www.instagram.com/oauth/authorize?client_id=...

---

## 🚀 Próximos Pasos

### Inmediatos (Usuario)
1. ✅ Frontend funcionando en http://localhost:3000
2. ✅ Backend responde en puerto 8000
3. ✅ Túnel HTTPS activo
4. **TODO**: Ir a http://localhost:3000 y hacer clic en "Conectar con Instagram / Facebook"
5. **TODO**: Completar login en Instagram y permitir permisos
6. **TODO**: Verificar que callback redirija a `http://localhost:3000?auth=success`

### Si callback devuelve `?auth=error`
- Revisar logs: `Get-Content "api/storage/logs/laravel.log" -Tail 50`
- Errores comunes:
  - `redirect_uri` no coincide → Actualizar `META_REDIRECT_URI` en `.env`
  - Túnel caído → Obtener nueva URL de localtunnel y actualizar
  - App Secret incorrecto → Verificar en Meta Dashboard
  - Código expirado → Reintentar login

### Después de Login Exitoso
- Token almacenado en sesión (`ig_token`, `ig_user_id`)
- Frontend muestra estado conectado
- Implementar endpoints para:
  - `/api/instagram/profile` - Datos del perfil
  - `/api/facebook/page` - Datos de página Facebook
  - `/api/instagram/posts` - Publicaciones
  - `/api/publish` - Crear nuevas publicaciones
  - Webhooks para notificaciones reales

---

## 📁 Estructura de Archivos Clave

```
api/
├── app/
│   ├── Services/MetaApiService.php      # Lógica OAuth y Meta API
│   └── Http/Controllers/AuthController.php
├── config/
│   ├── meta.php                         # Configuración Meta/Instagram
│   └── cors.php                         # CORS settings
├── routes/web.php                       # OAuth routes
└── .env                                 # Secretos y config sensible

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Dashboard principal
│   │   └── layout.tsx                   # Layout con Sidebar/Header
│   ├── context/AuthContext.tsx          # Auth state management
│   └── lib/api.ts                       # HTTP client helpers
├── next.config.ts
└── package.json
```

---

## 🔐 Datos Sensibles (No Compartir)

- **META_APP_SECRET**: `6f3c804b6d94fdbeb66f9919a85e2e37` (¡Proteger en producción!)
- **Instagram Business Account**: Vinculado a app ID `1474947117151473`
- **Tokens de sesión**: Guardados en base de datos SQLite bajo `sessions` table

---

## 📊 Flujo OAuth (Implementado)

```
1. Usuario: Clic en "Conectar con Instagram"
   ↓
2. Frontend: GET /auth/login (backend)
   ↓
3. Backend: Redirige a https://www.instagram.com/oauth/authorize?client_id=...&redirect_uri=https://orange-yaks-greet.loca.lt/auth/callback
   ↓
4. Instagram: Usuario inicia sesión y aprueba permisos
   ↓
5. Instagram: Redirige a https://orange-yaks-greet.loca.lt/auth/callback?code=XXX
   ↓
6. Backend: 
   - Intercambia code por short-lived token: https://api.instagram.com/oauth/access_token
   - Convierte a 60-day token: https://graph.instagram.com/access_token
   - Guarda en sesión: ig_token, ig_user_id
   ↓
7. Backend: Redirige a http://localhost:3000?auth=success
   ↓
8. Frontend: Detecta ?auth=success, muestra estado "Conectado"
```

---

## 🛠️ Comandos Útiles

```powershell
# Backend
cd api
php artisan serve --host=0.0.0.0 --port=8000      # Iniciar servidor
php artisan optimize:clear                          # Limpiar cache
php artisan tinker --execute "..."                  # Ejecutar código PHP

# Frontend
cd frontend
npm run dev                                          # Desarrollo
npm run build                                        # Producción

# Túnel HTTPS (múltiples opciones)
npx -y localtunnel --port 8000                      # Obtener URL pública
npx -y localtunnel --port 8000 --local-host 127.0.0.1

# Verificación
curl -I https://orange-yaks-greet.loca.lt/auth/login
```

---

## 📝 Notas de Debugging

### Si Frontend muestra 404 en raíz
- Borrar caché Next: `rm -Recurse -Force frontend/.next`
- Reiniciar: `npm run dev`
- Causa: Archivos de configuración Next corruptos

### Si OAuth devuelve "Invalid platform app"
- Verificar App ID coincida en Meta Dashboard y código
- Verificar redirect_uri es HTTPS y está registrada en Meta
- Verificar App Secret correcto

### Si localtunnel cae con 503
- Obtener URL nueva: `npx -y localtunnel --port 8000`
- Actualizar `META_REDIRECT_URI` en `.env`
- Ejecutar `php artisan optimize:clear`
- Actualizar redirect_uri en Meta Dashboard si URL cambió

---

## ✨ Estado de Sesión

**Último Check**: 31/03/2026 05:53 UTC
- ✅ Frontend (Next.js): Puerto 3000 respondiendo 200
- ✅ Backend (Laravel): Puerto 8000 respondiendo 200  
- ✅ Túnel HTTPS: `orange-yaks-greet.loca.lt` funcionando
- ⏳ OAuth callback: Pendiente prueba end-to-end
- ⚠️ Túnel: Inestable ocasionalmente (reintentos manuales)

---

## 📞 Contacto / Próxima Sesión

Para continuar:
1. Verificar que ambos servidores siguen corriendo
2. Comprobar URL del túnel actual (puede haber cambiado)
3. Reintentar OAuth flow completo desde http://localhost:3000
4. Si hay error, revisar logs del backend y reportar
