<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Las cuentas de Teko Social se crean y habilitan desde TEKO Planner (cuenta única).
 * Si PLANNER_API_URL no está definida, Social conserva su login local anterior.
 */
class PlannerAccess
{
    public function enabled(): bool
    {
        return (string) config('services.planner.url') !== '';
    }

    /** Valida correo/contraseña en el Planner y exige acceso a "social". Devuelve el usuario local. */
    public function login(string $email, string $password): User
    {
        $res = $this->request()->post('/integrations/verify-login', ['email' => $email, 'password' => $password, 'system' => 'social']);

        if ($res->status() === 403) {
            throw ValidationException::withMessages(['email' => ['Tu cuenta no tiene acceso a Teko Social.']]);
        }
        if (! $res->successful()) {
            throw ValidationException::withMessages(['email' => ['Credenciales invalidas.']]);
        }

        $remote = $res->json('data');
        $user = User::firstOrNew(['email' => $remote['email']]);
        $user->name = $remote['name'];
        // La contraseña real vive en el Planner; la local es aleatoria para que no sea un acceso alterno.
        if (! $user->exists) {
            $user->password = Str::random(48);
        }
        $user->save();

        return $user;
    }

    /** ¿Sigue habilitada la cuenta? (passkeys locales). Si el Planner no responde, se niega. */
    public function allowed(string $email): bool
    {
        $res = $this->request()->get('/integrations/access', ['email' => $email, 'system' => 'social']);

        return $res->successful() && (bool) $res->json('data.allowed');
    }

    private function request()
    {
        return Http::baseUrl(rtrim((string) config('services.planner.url'), '/'))
            ->withHeaders(['X-Service-Key' => (string) config('services.planner.key')])
            ->acceptJson()->timeout(10);
    }
}
