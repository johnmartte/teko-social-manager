"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

function SpiralIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="M22 6.5a15.5 15.5 0 0 0 0 31 9.2 9.2 0 1 0 0-18.4 4.4 4.4 0 1 1 0 8.8"
        stroke="#00A0FF"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M22 37.5a15.5 15.5 0 0 0 0-31 9.2 9.2 0 1 0 0 18.4 4.4 4.4 0 1 1 0-8.8"
        stroke="#1272FF"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12s3.8-6 9-6 9 6 9 6-3.8 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12s3.8-6 9-6 9 6 9 6-3.8 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const { isDark, toggleTheme } = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resetCode, setResetCode] = useState<string | null>(null);

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await api<{ success: boolean; code?: string }>("/auth/system/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      if (data.code) setResetCode(data.code);
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

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-black/20 px-3 py-2 text-xs text-white backdrop-blur-md hover:bg-black/30"
      >
        {isDark ? "Claro" : "Oscuro"}
      </button>

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/imagenes/wallpaperflare.com_wallpaper%20(6).jpg')" }}
      />
      <div className="absolute inset-0 bg-slate-900/35" />
      <div className="absolute inset-0 bg-linear-to-b from-slate-900/35 via-slate-900/18 to-slate-900/45" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-107.5 rounded-[18px] border border-white/32 bg-white/20 backdrop-blur-xl shadow-[0_26px_70px_rgba(8,17,34,0.42)] px-7 pt-8 pb-7 text-white">
          <div className="flex justify-center mb-3">
            <SpiralIcon />
          </div>

          {step === "email" && (
            <>
              <h1 className="text-[28px] leading-none font-semibold text-center tracking-[-0.02em]">
                Recupera tu contrasena
              </h1>
              <p className="text-center text-sm text-white/80 mt-3 mb-6 leading-6">
                Ingresa tu email y te enviaremos un codigo para restablecer tu contrasena.
              </p>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/90 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-[9px] border border-white/32 bg-white/18 px-3 text-[15px] text-white placeholder:text-white/55 outline-none focus:border-white/65"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && <p className="text-[13px] text-red-200">{error}</p>}

                <button
                  type="submit"
                  disabled={!email.trim() || submitting}
                  className="mt-3 h-11 w-full rounded-[9px] bg-[#222533] text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enviando..." : "Enviar codigo"}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <h1 className="text-[28px] leading-none font-semibold text-center tracking-[-0.02em]">
                Ingresa el codigo
              </h1>
              <p className="text-center text-sm text-white/80 mt-3 mb-6 leading-6">
                Introduce el codigo de 6 digitos y tu nueva contrasena.
              </p>

              {resetCode && (
                <div className="mb-4 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-center">
                  <p className="text-xs text-white/60 mb-1">Tu codigo de recuperacion:</p>
                  <p className="text-2xl font-mono font-bold tracking-[0.3em]">{resetCode}</p>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/90 mb-1.5">Codigo</label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-11 w-full rounded-[9px] border border-white/32 bg-white/18 px-3 text-[15px] text-white text-center font-mono tracking-[0.3em] placeholder:text-white/55 outline-none focus:border-white/65"
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/90 mb-1.5">Nueva contrasena</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-[9px] border border-white/32 bg-white/18 px-3 pr-11 text-[15px] text-white placeholder:text-white/55 outline-none focus:border-white/65"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((c) => !c)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                {error && <p className="text-[13px] text-red-200">{error}</p>}

                <button
                  type="submit"
                  disabled={code.length !== 6 || password.length < 8 || submitting}
                  className="mt-3 h-11 w-full rounded-[9px] bg-[#222533] text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Restableciendo..." : "Restablecer contrasena"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-[28px] leading-none font-semibold tracking-[-0.02em]">
                Contrasena actualizada
              </h1>
              <p className="text-sm text-white/80 mt-3 mb-6">
                Tu contrasena ha sido restablecida exitosamente.
              </p>
              <a
                href="/"
                className="inline-block h-11 leading-[44px] px-8 rounded-[9px] bg-[#222533] text-white font-medium"
              >
                Ir al dashboard
              </a>
            </div>
          )}

          {step !== "done" && (
            <Link
              href="/login"
              className="mt-6 block w-full text-center text-white/65 hover:text-white/80 text-sm"
            >
              Volver al login
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
