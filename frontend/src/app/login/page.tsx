"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Check, Eye, EyeOff, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { isCancelled, passkeysSupported } from "@/lib/passkeys";

export default function LoginPage() {
  const { loginWithEmail, loginWithPasskey } = useAuth();
  const supported = useSyncExternalStore(() => () => {}, passkeysSupported, () => false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 4 && password.trim().length >= 8;
  }, [email, password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await loginWithEmail(email.trim(), password, remember);
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesion";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onPasskey = async () => {
    setSubmitting(true);
    setError("");
    try {
      await loginWithPasskey();
      window.location.href = "/";
    } catch (err) {
      if (!isCancelled(err)) setError(err instanceof Error ? err.message : "No se pudo entrar con el passkey");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>

        <div className="mb-9">
          <h1 className="font-semibold">Inicia sesión</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Ingresa con tus credenciales para continuar.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer select-none">
            <span className="relative flex size-4 items-center justify-center">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="peer absolute inset-0 size-4 cursor-pointer opacity-0"
              />
              <span className="size-4 rounded border border-border bg-background peer-checked:border-primary peer-checked:bg-primary transition-colors" />
              <Check className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} />
            </span>
            Recordarme en este dispositivo
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿La olvidaste?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((c) => !c)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-error border border-error-border bg-error-light rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        {supported && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              o
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full" disabled={submitting} onClick={onPasskey}>
              <Fingerprint className="size-4" />
              Entrar con Touch ID / passkey
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-foreground hover:underline underline-offset-4">
            Regístrate
          </Link>
        </p>
    </AuthLayout>
  );
}
