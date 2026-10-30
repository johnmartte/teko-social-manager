<?php

namespace App\Http\Controllers;

use App\Models\Passkey;
use App\Services\PlannerAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use ParagonIE\ConstantTime\Base64UrlSafe;
use Symfony\Component\Serializer\Encoder\JsonEncode;
use Symfony\Component\Serializer\Normalizer\AbstractObjectNormalizer;
use Symfony\Component\Serializer\SerializerInterface;
use Throwable;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AuthenticatorSelectionCriteria;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\CredentialRecord;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialDescriptor;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;

/**
 * Passkeys (WebAuthn): permiten entrar con Touch ID / huella / gestor de contraseñas sin escribir correo y contraseña.
 * El RP ID sale del Origin del navegador, que debe estar en la lista CORS permitida.
 */
class PasskeyController extends Controller
{
    private const CHALLENGE_TTL = 300;

    private SerializerInterface $serializer;

    public function __construct()
    {
        $this->serializer = (new WebauthnSerializerFactory(new AttestationStatementSupportManager()))->create();
    }

    // ── Registro (usuario con sesión) ─────────────────────────────────────

    public function registerOptions(Request $request): JsonResponse
    {
        [$origin, $rpId] = $this->context($request);
        $user = $request->user();

        $options = PublicKeyCredentialCreationOptions::create(
            PublicKeyCredentialRpEntity::create('Teko Social', $rpId),
            PublicKeyCredentialUserEntity::create($user->email, (string) $user->id, $user->name),
            random_bytes(32),
            [PublicKeyCredentialParameters::create('public-key', -7), PublicKeyCredentialParameters::create('public-key', -257)],
            AuthenticatorSelectionCriteria::create(
                null,
                AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_PREFERRED,
                AuthenticatorSelectionCriteria::RESIDENT_KEY_REQUIREMENT_REQUIRED, // permite entrar sin escribir el correo
            ),
            PublicKeyCredentialCreationOptions::ATTESTATION_CONVEYANCE_PREFERENCE_NONE,
            $user->passkeys->map(fn (Passkey $p) => PublicKeyCredentialDescriptor::create('public-key', Base64UrlSafe::decodeNoPadding($p->credential_id)))->all(),
            60000,
        );

        $json = $this->toJson($options);
        Cache::put("webauthn:reg:{$user->id}", $json, self::CHALLENGE_TTL);

        return response()->json(json_decode($json, true));
    }

    public function registerVerify(Request $request): JsonResponse
    {
        [$origin, $rpId] = $this->context($request);
        $user = $request->user();

        $data = $request->validate([
            'credential' => ['required', 'array'],
            'name' => ['nullable', 'string', 'max:80'],
        ]);

        $stored = Cache::pull("webauthn:reg:{$user->id}");
        if (!$stored) {
            return response()->json(['error' => 'La solicitud expiró. Inténtalo de nuevo.'], 422);
        }

        try {
            $options = $this->serializer->deserialize($stored, PublicKeyCredentialCreationOptions::class, 'json');
            $credential = $this->serializer->deserialize(json_encode($data['credential']), PublicKeyCredential::class, 'json');

            if (!$credential->response instanceof AuthenticatorAttestationResponse) {
                return response()->json(['error' => 'Respuesta de passkey no válida.'], 422);
            }

            $factory = $this->factory($origin);
            $record = AuthenticatorAttestationResponseValidator::create($factory->creationCeremony())
                ->check($credential->response, $options, $rpId);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['error' => 'No se pudo verificar el passkey.'], 422);
        }

        $credentialId = Base64UrlSafe::encodeUnpadded($record->publicKeyCredentialId);

        if (Passkey::where('credential_id', $credentialId)->exists()) {
            return response()->json(['error' => 'Este passkey ya está registrado.'], 422);
        }

        $passkey = $user->passkeys()->create([
            'name' => trim($data['name'] ?? '') ?: 'Este dispositivo',
            'credential_id' => $credentialId,
            'record' => $this->serializer->serialize($record, 'json'),
        ]);

        return response()->json(['passkey' => $this->resource($passkey)], 201);
    }

    // ── Gestión ───────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        return response()->json(['passkeys' => $request->user()->passkeys()->latest()->get()->map(fn ($p) => $this->resource($p))]);
    }

    public function destroy(Request $request, Passkey $passkey): JsonResponse
    {
        abort_unless($passkey->user_id === $request->user()->id, 404);
        $passkey->delete();

        return response()->json(['success' => true]);
    }

    // ── Inicio de sesión (público) ────────────────────────────────────────

    public function loginOptions(Request $request): JsonResponse
    {
        [, $rpId] = $this->context($request);

        $options = PublicKeyCredentialRequestOptions::create(
            random_bytes(32),
            $rpId,
            [],
            PublicKeyCredentialRequestOptions::USER_VERIFICATION_REQUIREMENT_PREFERRED,
            60000,
        );

        $token = Str::random(40);
        $json = $this->toJson($options);
        Cache::put("webauthn:login:{$token}", $json, self::CHALLENGE_TTL);

        return response()->json(['token' => $token, 'options' => json_decode($json, true)]);
    }

    public function loginVerify(Request $request): JsonResponse
    {
        [$origin, $rpId] = $this->context($request);

        $data = $request->validate([
            'token' => ['required', 'string', 'size:40'],
            'credential' => ['required', 'array'],
        ]);

        $stored = Cache::pull("webauthn:login:{$data['token']}"); // de un solo uso
        $invalid = response()->json(['error' => 'No se pudo iniciar sesión con el passkey.'], 401);

        if (!$stored) {
            return $invalid;
        }

        try {
            $options = $this->serializer->deserialize($stored, PublicKeyCredentialRequestOptions::class, 'json');
            $credential = $this->serializer->deserialize(json_encode($data['credential']), PublicKeyCredential::class, 'json');

            if (!$credential->response instanceof AuthenticatorAssertionResponse) {
                return $invalid;
            }

            $passkey = Passkey::with('user')->where('credential_id', Base64UrlSafe::encodeUnpadded($credential->rawId))->first();
            if (!$passkey) {
                return $invalid;
            }

            /** @var CredentialRecord $record */
            $record = $this->serializer->deserialize($passkey->record, CredentialRecord::class, 'json');

            $updated = AuthenticatorAssertionResponseValidator::create($this->factory($origin)->requestCeremony())
                ->check($record, $credential->response, $options, $rpId, $credential->response->userHandle);
        } catch (Throwable $e) {
            report($e);

            return $invalid;
        }

        // El contador sube en cada uso: así se detectan passkeys clonados.
        $passkey->update(['record' => $this->serializer->serialize($updated, 'json'), 'last_used_at' => now()]);
        $user = $passkey->user;

        // Un passkey no salta el control de acceso: el Planner decide si la cuenta sigue habilitada.
        $planner = app(PlannerAccess::class);
        if ($planner->enabled() && !$planner->allowed($user->email)) {
            return response()->json(['error' => 'Tu cuenta no tiene acceso a Teko Social.'], 403);
        }

        return response()->json([
            'token' => $user->createToken('teko-frontend')->plainTextToken,
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ]);
    }

    // ── Utilidades ────────────────────────────────────────────────────────

    /** @return array{0: string, 1: string} [origin, rpId] */
    private function context(Request $request): array
    {
        $origin = rtrim((string) $request->headers->get('Origin'), '/');
        abort_unless($origin !== '' && in_array($origin, config('cors.allowed_origins', []), true), 403, 'Origen no permitido.');

        return [$origin, (string) parse_url($origin, PHP_URL_HOST)];
    }

    private function factory(string $origin): CeremonyStepManagerFactory
    {
        $factory = new CeremonyStepManagerFactory();
        $factory->setAllowedOrigins([$origin]);
        $factory->setSecuredRelyingPartyId(['localhost']); // permite http solo en desarrollo local

        return $factory;
    }

    private function toJson(object $options): string
    {
        return $this->serializer->serialize($options, 'json', [
            AbstractObjectNormalizer::SKIP_NULL_VALUES => true,
            JsonEncode::OPTIONS => JSON_THROW_ON_ERROR,
        ]);
    }

    private function resource(Passkey $p): array
    {
        return ['id' => $p->id, 'name' => $p->name, 'created_at' => $p->created_at, 'last_used_at' => $p->last_used_at];
    }
}
