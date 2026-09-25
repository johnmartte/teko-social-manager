"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandMark from "@/components/BrandMark";

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api<{ success: boolean }>("/auth/system/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar codigo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await api<{ token: string; user: { id: number; name: string; email: string } }>(
        "/auth/system/reset-password",
        {
          method: "POST",
          body: { email: email.trim(), code: code.trim(), password },
        }
      );
      localStorage.setItem("app_token", data.token);
      localStorage.setItem("app_user", JSON.stringify(data.user));
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer");
    } finally {
      setSubmitting(false);
    }
  }

  const errorBox = error && (
    <p className="text-sm text-error border border-error-border bg-error-light rounded-md px-3 py-2">
      {error}
    </p>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <BrandMark />
        </div>

        {step === "email" && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight">Recupera tu contraseña</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Te enviaremos un código de verificación a tu correo.
              </p>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-4">
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

              {errorBox}

              <Button type="submit" className="w-full" disabled={!email.trim() || submitting}>
                {submitting ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight">Ingresa el código</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Revisa tu correo e introduce el código de 6 dígitos junto con tu nueva contraseña.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center font-mono tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
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

              {errorBox}

              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || password.length < 8 || submitting}
              >
                {submitting ? "Restableciendo..." : "Restablecer contraseña"}
              </Button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="size-10 rounded-full bg-success-light border border-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="size-5 text-success" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Contraseña actualizada</h1>
            <p className="text-sm text-muted-foreground mt-1.5 mb-6">
              Tu contraseña se restableció correctamente.
            </p>
            <Button asChild className="w-full">
              <a href="/">Ir al dashboard</a>
            </Button>
          </div>
        )}

        {step !== "done" && (
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            Volver al inicio de sesión
          </Link>
        )}
      </div>
    </div>
  );
}
