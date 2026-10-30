# Prompt: añadir acceso con Touch ID / passkeys (WebAuthn) a este proyecto

> Copia todo lo que está debajo de la línea y pégalo en el chat del proyecto destino.

---

Quiero que implementes **inicio de sesión con passkeys (WebAuthn)** en este proyecto, para entrar con la huella del MacBook (Touch ID) o con el gestor de contraseñas (iCloud / Google) sin escribir correo y contraseña cada vez. Ya lo hice en otro sistema mío (Laravel + Next.js) y funcionó; abajo tienes el diseño exacto, los errores que evité y los requisitos de seguridad. **Adáptalo a la pila de ESTE proyecto, no copies a ciegas.**

## 0. Antes de escribir código (obligatorio)
1. Lee cómo funciona hoy la autenticación aquí: modelo de usuario, login por correo/contraseña, cómo se emite la sesión o el token, middleware, CORS y dónde vive el frontend frente a la API.
2. Dime en 5-8 líneas el plan adaptado a esta pila, y qué librería WebAuthn vas a usar. **No implementes tu propio WebAuthn**: usa una librería mantenida (ej. PHP `web-auth/webauthn-lib` 5.x, Node `@simplewebauthn/server`, Python `py_webauthn`, Go `go-webauthn/webauthn`, etc.).
3. Verifica la versión instalada de la librería leyendo su código en `vendor/` o `node_modules/`: las APIs cambian entre versiones, no las adivines.
4. Haz el cambio **más pequeño que resuelva todo**. Reutiliza lo existente (modelos, middleware, el mismo emisor de tokens que usa el login actual). No añadas funciones que no pedí. No recortes validación, seguridad ni manejo de errores.

## 1. Qué debe hacer (comportamiento)
- El usuario inicia sesión una vez con correo y contraseña, va a **Configuración** y pulsa "Activar Touch ID en este dispositivo". El sistema operativo pide la huella y se guarda el passkey.
- Después, en la pantalla de login hay un botón **"Entrar con Touch ID / passkey"**: pide la huella y entra directo, **sin escribir el correo** (credenciales descubribles / "resident key").
- En Configuración se listan los passkeys (nombre, último uso) y se pueden eliminar. Se pueden añadir varios dispositivos.
- El botón solo aparece si el navegador soporta WebAuthn. Si el usuario cancela el diálogo del sistema, no se muestra error.
- Si alguien pierde el dispositivo, sigue entrando con correo y contraseña (el login actual NO se elimina ni se debilita).

## 2. Backend
**Tabla `passkeys`:** `id`, `user_id` (FK con borrado en cascada), `name` (≤80), `credential_id` (único, base64url sin relleno, hasta 512 chars), `record` (texto largo: el registro de credencial serializado con el serializador de la librería: clave pública, contador, transportes, etc.), `last_used_at` (nullable), timestamps. Oculta `record` en las respuestas JSON.

**Rutas** (adapta prefijos a las convenciones del proyecto):
| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/auth/passkeys/options` | sesión | Crea opciones de registro y guarda el reto |
| POST | `/auth/passkeys` | sesión | Verifica el registro y guarda el passkey |
| GET | `/auth/passkeys` | sesión | Lista los del usuario |
| DELETE | `/auth/passkeys/{id}` | sesión | Borra uno (solo si es del usuario; si no, 404) |
| POST | `/auth/passkey/login-options` | pública, limitada a ~20/min | Opciones de login + `token` de un solo uso |
| POST | `/auth/passkey/login` | pública, limitada a ~10/min | Verifica la aserción y emite la sesión |

**Registro:** relying party `{ name: "<nombre del producto>", id: rpId }`; usuario `{ id: <id interno como string, máx. 64 bytes>, name: email, displayName: nombre }`; algoritmos ES256 (-7) y RS256 (-257); `residentKey: required`; `userVerification: preferred`; `attestation: none`; `excludeCredentials` con los passkeys que ya tiene (evita duplicados); `timeout` 60 s. Guarda las opciones serializadas en caché 5 min, con clave por usuario, y **consúmelas al verificar** (una sola vez).

**Login:** opciones con `allowCredentials` vacío (descubribles), `userVerification: preferred`. Genera un `token` aleatorio de 40 caracteres, guarda las opciones en caché con esa clave 5 min y devuélvelo junto a las opciones. Al verificar, **consume el token** (`pull`, un solo uso). Busca el passkey por el `rawId` (base64url), deserializa su `record`, valida la aserción con `userHandle`, y **guarda el registro actualizado** (el contador sube: así se detectan passkeys clonados) y `last_used_at`. Emite la sesión/token **por el mismo mecanismo que usa el login de contraseña** y devuelve la misma forma de respuesta. Cualquier fallo devuelve un único error genérico 401 (no reveles si el passkey existe) y registra la excepción en el log.

### RP ID y origen: la trampa más importante
- Si el frontend y la API viven en dominios distintos (ej. frontend `app.midominio.com`, API en `xxx.up.railway.app`), el **RP ID es el dominio del FRONTEND**, no el de la API. Usa el sitio donde corre el navegador.
- **No lo fijes a mano ni lo saques de `Host`.** Derívalo del header `Origin` de la petición, y **acéptalo solo si está en la lista de orígenes CORS permitidos** del proyecto (si no, 403). RP ID = host de ese origen. Pásalo también como único origen permitido a la ceremonia de verificación.
- Permite `localhost` por http únicamente para desarrollo local (en la librería PHP: `setSecuredRelyingPartyId(['localhost'])`).
- Un passkey queda atado a ese dominio: el creado en `localhost` no sirve en producción. Avísame de esto al final.

## 3. Frontend
- Helper `passkeys` con: `passkeysSupported()`, `registerPasskey(name)`, `loginWithPasskeyCeremony()`, `isCancelled(e)` (`NotAllowedError` / `AbortError`).
- El servidor habla **base64url**; el navegador necesita `ArrayBuffer`. Convierte `challenge`, `user.id` y los `id` de `excludeCredentials` / `allowCredentials` con helpers de ida y vuelta. Para enviar la credencial, codifica en base64url `rawId`, `clientDataJSON`, `attestationObject` (registro) o `authenticatorData`, `signature` y `userHandle` (login), añade `transports` con `response.getTransports?.()` y `clientExtensionResults`. No uses `toJSON()` / `parseCreationOptionsFromJSON`: el soporte varía entre navegadores.
- Evita errores de hidratación (SSR): detecta el soporte con `useSyncExternalStore` (o equivalente) en vez de leer `window` al renderizar.
- Login: botón "Entrar con Touch ID / passkey" bajo el formulario, separado con un "o". Al terminar, guarda la sesión igual que el login normal y redirige.
- Configuración: tarjeta "Acceso rápido (Touch ID)" con la lista, el botón de activar / añadir otro dispositivo y el borrado. Usa los componentes UI y el sistema de notificaciones que ya existan en el proyecto.
- Todo el texto de interfaz en **español**.

## 4. Seguridad (no negociable)
- Retos aleatorios de 32 bytes, de un solo uso y con caducidad corta.
- Verificación completa en el servidor con la librería: challenge, origen, RP ID hash, tipo de ceremonia, flags de presencia/verificación, firma y contador.
- Rate limit en las dos rutas públicas.
- El usuario del passkey se obtiene del registro guardado en base de datos, **nunca de datos que envíe el cliente**.
- Borrado solo de passkeys propios.
- No logs con retos, firmas ni claves.
- Cuando el contador no sube, rechaza el login.

## 5. Cómo verificar (sin navegador ni huella)
No puedes probar Touch ID, pero **sí puedes probar el servidor de punta a punta** con un autenticador por software: un script que haga peticiones HTTP reales a la API local y simule el authenticator:
- Genera una llave EC P-256 con OpenSSL.
- Registro: `clientDataJSON` con tipo `webauthn.create`, el challenge y el origen reales; `authData` = SHA-256(rpId) + flags `0x45` + contador de 4 bytes + AAGUID de 16 ceros + longitud del credId (2 bytes) + credId + clave pública COSE (mapa CBOR `{1:2, 3:-7, -1:1, -2:x, -3:y}`); `attestationObject` CBOR `{fmt:"none", attStmt:{}, authData}`.
- Login: `authData` = SHA-256(rpId) + flags `0x05` + contador creciente; firma ECDSA-SHA256 sobre `authData || SHA-256(clientDataJSON)` en DER; incluye `userHandle`.
- Casos que DEBEN pasar: registro válido (201), listado, login válido (200 + token que sirve en una ruta protegida), segundo login con contador mayor (200), borrado.
- Casos que DEBEN fallar: origen fuera de CORS (403), registro con challenge falso (422), reutilizar el mismo reto (401), firma de otra llave (401), contador repetido (401).
- Ejecútalo contra el servidor local, muéstrame la salida y **bórralo al terminar** (no lo subas al repo salvo que yo lo pida).

Además: type-check y lint del frontend sin errores, build de producción OK, y migración aplicada en la base local.

## 6. Documentación y entrega
- Si el proyecto tiene manual o sección de ayuda, añade una guía "Entrar con Touch ID" y dos preguntas frecuentes (cómo entrar sin escribir contraseña / qué pasa si cambio de computadora). Si no la tiene, no la crees.
- Haz el commit, **sin push**: yo hago el push. Termina con un resumen corto que diga: qué se hizo, qué probaste y con qué resultado, qué NO pudiste probar (la huella real), y qué debo hacer yo (migrar, variables de entorno, activar el passkey desde el dominio real de producción, no desde localhost).
- Si algo de este diseño choca con la pila del proyecto, dímelo y propón la alternativa más simple antes de implementar.
