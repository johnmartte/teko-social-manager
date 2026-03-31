# 📱 Teko Social Manager

Sistema de administración de redes sociales (Instagram y Facebook) usando la API oficial de Meta.

---

## 📋 Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Limitaciones importantes de la API](#limitaciones-importantes-de-la-api)
3. [Requisitos previos](#requisitos-previos)
4. [Configuración en Meta Developers](#configuración-en-meta-developers)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Instalación](#instalación)
7. [Variables de entorno](#variables-de-entorno)
8. [Flujo de autenticación OAuth](#flujo-de-autenticación-oauth)
9. [Funcionalidades y endpoints](#funcionalidades-y-endpoints)
10. [Roadmap de desarrollo](#roadmap-de-desarrollo)
11. [Recursos útiles](#recursos-útiles)

---

## 🎯 Resumen del Proyecto

**Teko Social Manager** es un sistema web que permite gestionar cuentas de Instagram y Facebook desde un único dashboard. Utiliza la API oficial de Instagram (Instagram Graph API) y la API de páginas de Facebook (Pages API) de Meta.

**Tecnologías:**
- Backend: Node.js + Express
- Frontend: HTML + CSS + JavaScript (Vanilla o React)
- API: Meta Graph API (Instagram + Facebook)
- Auth: OAuth 2.0 con Instagram Business Login

---

## ⚠️ Limitaciones importantes de la API

Antes de comenzar, es fundamental conocer qué **sí** y qué **no** permite la API oficial de Meta:

| Funcionalidad | Disponible |
|---|---|
| Publicar fotos, videos, Reels | ✅ Sí |
| Publicar Stories | ✅ Sí |
| Publicar carruseles | ✅ Sí |
| Ver estadísticas (Insights) | ✅ Sí |
| Moderar comentarios | ✅ Sí |
| Enviar/recibir mensajes directos | ✅ Sí |
| Ver el feed de la cuenta | ✅ Sí |
| Eliminar publicaciones propias | ✅ Sí |
| **Seguir personas** | ❌ No permitido por la API |
| **Dejar de seguir personas** | ❌ No permitido por la API |
| Publicar en cuentas personales | ❌ Solo cuentas Business/Creator |

> ⚠️ Meta no expone endpoints de follow/unfollow en su API pública. Intentar automatizar esto viola sus políticas de uso.

---

## ✅ Requisitos previos

### Cuentas necesarias
- Cuenta de **Facebook** de desarrollador
- Cuenta de **Instagram Business o Creator** (no personal)
  - Para convertirla: Instagram → Configuración → Cuenta → Cambiar a cuenta profesional
- Cuenta de Instagram vinculada a una **Página de Facebook**

### Software necesario
- Node.js (v18 o superior)
- npm o yarn
- Git
- Un editor de código (VS Code recomendado)

---

## ⚙️ Configuración en Meta Developers

### Paso 1 — Crear la App en Meta Developers

1. Ve a [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Haz clic en **"Crear app"**
3. Selecciona el tipo **"Business"**
4. Agrega nombre y correo de contacto
5. Haz clic en **"Crear app"**

### Paso 2 — Agregar casos de uso

Agrega **únicamente** estos dos casos de uso:

- ✅ **"Administrar mensajes y contenido en Instagram"** — Para toda la gestión de Instagram
- ✅ **"Administrar todos los aspectos de tu página"** — Para gestión de Facebook Pages

### Paso 3 — Configurar permisos de Instagram

En el caso de uso de Instagram, haz clic en **"Add all required permissions"**. Esto agrega:

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_manage_comments`
- `instagram_business_manage_messages`
- `instagram_business_manage_insights`

### Paso 4 — Agregar cuenta de Instagram para pruebas

1. En **Roles → Roles**, agrega tu usuario de Instagram como **"Evaluador de Instagram"**
2. Desde la app de Instagram en tu celular, acepta la invitación:
   - Configuración → Aplicaciones y sitios web → Solicitudes de evaluadores
3. Regresa a la configuración de la API y haz clic en **"Agregar cuenta"**

### Paso 5 — Credenciales de la app

Guarda estas credenciales (se usan en el archivo `.env`):

| Campo | Dónde encontrarlo |
|---|---|
| **App ID** | Configuración → Básica |
| **App Secret** | Configuración → Básica → "Mostrar" |

> 🔒 **NUNCA** compartas ni subas el App Secret a GitHub. Úsalo solo en tu archivo `.env` local.

### Paso 6 — Configurar OAuth Redirect URI

1. Ve a **Instagram → Configuración de la API con inicio de sesión**
2. En **"Configurar Instagram Business Login"**, agrega tu Redirect URI:
   - Desarrollo: `http://localhost:3000/auth/callback`
   - Producción: `https://tu-dominio.com/auth/callback`

### Paso 7 — Webhooks (para más adelante)

Los webhooks se configuran cuando tengas un servidor con URL pública. Permiten recibir notificaciones en tiempo real de:
- Nuevos comentarios
- Nuevos mensajes directos
- Menciones

> ⏳ Este paso se completa en la Fase 3 del desarrollo.

---

## 🗂️ Estructura del proyecto

```
teko-social-manager/
├── backend/
│   ├── server.js              # Servidor principal Express
│   ├── routes/
│   │   ├── auth.js            # Rutas de autenticación OAuth
│   │   ├── instagram.js       # Rutas de Instagram
│   │   └── facebook.js        # Rutas de Facebook
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── instagramController.js
│   │   └── facebookController.js
│   ├── services/
│   │   ├── instagramService.js  # Lógica de llamadas a la API de IG
│   │   └── facebookService.js   # Lógica de llamadas a la API de FB
│   ├── middleware/
│   │   └── auth.js              # Middleware de verificación de token
│   ├── .env                     # Variables de entorno (NO subir a GitHub)
│   ├── .env.example             # Plantilla de variables de entorno
│   └── package.json
├── frontend/
│   ├── index.html               # Dashboard principal
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js
│       ├── instagram.js
│       └── facebook.js
├── .gitignore
└── README.md
```

---

## 🚀 Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/teko-social-manager.git
cd teko-social-manager

# 2. Instala dependencias del backend
cd backend
npm install

# 3. Crea tu archivo de variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 4. Inicia el servidor
npm run dev
```

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la carpeta `backend/` con este contenido:

```env
# Meta App Credentials
APP_ID=2106254986819873
APP_SECRET=tu_app_secret_aqui

# OAuth
REDIRECT_URI=http://localhost:3000/auth/callback

# Servidor
PORT=3000
NODE_ENV=development

# Opcional: Token de larga duración guardado
INSTAGRAM_ACCESS_TOKEN=
FACEBOOK_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
```

> ⚠️ Agrega `.env` a tu `.gitignore` para que nunca se suba a GitHub.

---

## 🔑 Flujo de autenticación OAuth

El flujo de autenticación funciona así:

```
Usuario hace clic en "Conectar Instagram"
         ↓
Backend redirige a Meta OAuth
(https://www.instagram.com/oauth/authorize)
         ↓
Usuario inicia sesión y aprueba permisos
         ↓
Meta redirige a tu Redirect URI con un ?code=...
         ↓
Backend intercambia el code por un Access Token
(POST https://api.instagram.com/oauth/access_token)
         ↓
Backend solicita un token de larga duración (60 días)
(GET https://graph.instagram.com/access_token)
         ↓
Token guardado y listo para usar
```

### URL de autorización

```
https://www.instagram.com/oauth/authorize
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT_URI}
  &scope=instagram_business_basic,instagram_business_content_publish,instagram_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights
  &response_type=code
```

### Intercambio de código por token

```bash
POST https://api.instagram.com/oauth/access_token
  client_id={APP_ID}
  client_secret={APP_SECRET}
  grant_type=authorization_code
  redirect_uri={REDIRECT_URI}
  code={CODE_RECIBIDO}
```

### Token de larga duración

```bash
GET https://graph.instagram.com/access_token
  ?grant_type=ig_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &access_token={SHORT_TOKEN}
```

---

## 📡 Funcionalidades y endpoints

### Instagram

#### Ver perfil y media
```
GET https://graph.instagram.com/me
  ?fields=id,username,name,biography,followers_count,media_count
  &access_token={TOKEN}

GET https://graph.instagram.com/{IG_USER_ID}/media
  ?fields=id,caption,media_type,media_url,thumbnail_url,timestamp
  &access_token={TOKEN}
```

#### Publicar una foto
```
# Paso 1: Crear contenedor
POST https://graph.instagram.com/{IG_USER_ID}/media
  image_url=https://url-publica-de-tu-imagen.jpg
  caption=Tu pie de foto aquí
  access_token={TOKEN}

# Paso 2: Publicar el contenedor
POST https://graph.instagram.com/{IG_USER_ID}/media_publish
  creation_id={IG_CONTAINER_ID}
  access_token={TOKEN}
```

> ⚠️ La imagen debe estar en una URL pública accesible. Límite: 100 posts por 24 horas.

#### Publicar un Reel
```
POST https://graph.instagram.com/{IG_USER_ID}/media
  media_type=REELS
  video_url=https://url-publica-de-tu-video.mp4
  caption=Tu descripción aquí
  access_token={TOKEN}
```

#### Publicar un carrusel
```
# Paso 1: Crear contenedor para cada imagen
POST https://graph.instagram.com/{IG_USER_ID}/media
  image_url=https://imagen1.jpg
  is_carousel_item=true
  access_token={TOKEN}

# Paso 2: Crear contenedor del carrusel
POST https://graph.instagram.com/{IG_USER_ID}/media
  media_type=CAROUSEL
  children={ID1},{ID2},{ID3}
  caption=Descripción del carrusel
  access_token={TOKEN}

# Paso 3: Publicar
POST https://graph.instagram.com/{IG_USER_ID}/media_publish
  creation_id={CAROUSEL_CONTAINER_ID}
  access_token={TOKEN}
```

#### Estadísticas de la cuenta
```
GET https://graph.instagram.com/{IG_USER_ID}/insights
  ?metric=impressions,reach,profile_views,follower_count
  &period=day
  &access_token={TOKEN}
```

#### Estadísticas de un post
```
GET https://graph.instagram.com/{IG_MEDIA_ID}/insights
  ?metric=impressions,reach,engagement,saved
  &access_token={TOKEN}
```

#### Moderar comentarios
```
# Ver comentarios de un post
GET https://graph.instagram.com/{IG_MEDIA_ID}/comments
  ?access_token={TOKEN}

# Responder a un comentario
POST https://graph.instagram.com/{IG_MEDIA_ID}/replies
  message=Tu respuesta aquí
  access_token={TOKEN}

# Ocultar un comentario
POST https://graph.instagram.com/{IG_COMMENT_ID}
  hide=true
  access_token={TOKEN}

# Eliminar un comentario
DELETE https://graph.instagram.com/{IG_COMMENT_ID}
  access_token={TOKEN}
```

### Facebook (Pages API)

#### Ver información de la página
```
GET https://graph.facebook.com/{PAGE_ID}
  ?fields=id,name,fan_count,followers_count,about
  &access_token={PAGE_TOKEN}
```

#### Publicar en la página
```
POST https://graph.facebook.com/{PAGE_ID}/feed
  message=Tu publicación aquí
  access_token={PAGE_TOKEN}
```

#### Estadísticas de la página
```
GET https://graph.facebook.com/{PAGE_ID}/insights
  ?metric=page_impressions,page_reach,page_fans
  &period=day
  &access_token={PAGE_TOKEN}
```

---

## 🗺️ Roadmap de desarrollo

### Fase 1 — Autenticación y conexión ✅ En progreso
- [ ] Configuración de la app en Meta Developers
- [ ] Flujo OAuth con Instagram
- [ ] Flujo OAuth con Facebook
- [ ] Guardar y renovar tokens de acceso
- [ ] Dashboard básico con estado de conexión

### Fase 2 — Publicación de contenido
- [ ] Publicar fotos en Instagram
- [ ] Publicar videos y Reels en Instagram
- [ ] Publicar carruseles en Instagram
- [ ] Publicar Stories en Instagram
- [ ] Publicar en página de Facebook
- [ ] Programador de publicaciones (con fecha y hora)
- [ ] Vista previa antes de publicar

### Fase 3 — Estadísticas
- [ ] Dashboard de métricas de Instagram
- [ ] Dashboard de métricas de Facebook
- [ ] Estadísticas por post
- [ ] Gráficas de crecimiento
- [ ] Exportar reportes

### Fase 4 — Gestión de comentarios y mensajes
- [ ] Ver y responder comentarios de Instagram
- [ ] Ocultar/eliminar comentarios
- [ ] Bandeja de mensajes directos de Instagram
- [ ] Moderar comentarios de Facebook

### Fase 5 — Webhooks y notificaciones en tiempo real
- [ ] Configurar servidor de webhooks
- [ ] Notificaciones de nuevos comentarios
- [ ] Notificaciones de nuevos mensajes
- [ ] Alertas del sistema

### Fase 6 — Producción
- [ ] Deploy del backend (Railway, Render, o VPS)
- [ ] Deploy del frontend
- [ ] Configurar App Review de Meta para acceso avanzado
- [ ] SSL y seguridad

---

## 📚 Recursos útiles

- [Instagram Platform Overview](https://developers.facebook.com/docs/instagram-platform/overview)
- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- [Insights Guide](https://developers.facebook.com/docs/instagram-platform/insights)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/) — Para probar llamadas a la API
- [Meta App Dashboard](https://developers.facebook.com/apps)
- [Error Codes Reference](https://developers.facebook.com/docs/instagram-api/reference/error-codes)

---

## 🔒 Seguridad

- **NUNCA** subas el archivo `.env` a GitHub
- **NUNCA** expongas el App Secret en el frontend
- Todos los tokens deben manejarse únicamente en el backend
- Rota el App Secret si sospechas que fue comprometido (Configuración → Básica → Restablecer)
- Los tokens de larga duración expiran en 60 días — implementa un sistema de renovación automática

---

## 📝 Notas adicionales

- La app debe pasar el **App Review de Meta** antes de poder acceder a cuentas que no son tuyas
- Durante el desarrollo, solo puedes acceder a cuentas que hayas agregado como evaluadores (testers)
- Límite de publicación: **100 posts por 24 horas** vía API
- Los webhooks requieren que la app esté publicada y el servidor tenga URL pública con HTTPS

---

*Proyecto desarrollado con la asistencia de Claude (Anthropic)*
