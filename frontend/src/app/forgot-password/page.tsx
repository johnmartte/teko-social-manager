"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

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

const inputStyle = { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#f2f3f5" };
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(30,196,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30,196,255,0.1)"; };
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; };

const primaryBtn = { background: "#1ec4ff", color: "#080a0f", boxShadow: "0 8px 24px -6px rgba(30,196,255,0.45)" };

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

  return (
    <main className="grid min-h-screen lg:grid-cols-2 bg-[#080a0f] text-[#f2f3f5]">
      {/* Left: decorative */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ background: "linear-gradient(135deg, #080a0f, #0a1628)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 60% at 30% 80%, rgba(30,196,255,0.14), transparent 70%)" }}
        />
        <div className="absolute top-14 left-14">
          <img src="/logos/Isologo-White.svg" alt="TEKO" className="h-8 w-auto" />
        </div>
        <div className="absolute bottom-16 left-14 max-w-lg">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[.25em] text-[#1ec4ff]">TEKO MANAGER</p>
          <h1 className="text-5xl font-bold leading-tight">Recupera el acceso a tu cuenta.</h1>
          <p className="mt-5 text-lg text-white/55">
            Te enviaremos un codigo de verificacion a tu correo.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-3xl border p-8"
          style={{
            borderColor: "rgba(255,255,255,0.1)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          }}
        >
          <img src="/logos/Isologo-White.svg" alt="TEKO" className="mb-10 h-8 w-auto lg:hidden" />

          {step === "email" && (
            <>
              <p className="text-sm font-medium text-[#1ec4ff]">Recuperacion</p>
              <h2 className="mt-1 text-3xl font-bold">Recupera tu contrasena</h2>
              <p className="mt-2 text-sm text-white/50">
                Ingresa tu email y te enviaremos un codigo para restablecer tu contrasena.
              </p>

              {error && (
                <p className="mt-5 rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                  {error}
                </p>
              )}

              <form onSubmit={handleRequestCode}>
                <label className="mt-8 block text-sm font-medium">
                  Email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition-all placeholder:text-white/40"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!email.trim() || submitting}
                  className="mt-7 w-full rounded-xl py-3 font-semibold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={primaryBtn}
                >
                  {submitting ? "Enviando..." : "Enviar codigo"}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <p className="text-sm font-medium text-[#1ec4ff]">Verificacion</p>
              <h2 className="mt-1 text-3xl font-bold">Ingresa el codigo</h2>
              <p className="mt-2 text-sm text-white/50">
                Revisa tu email e introduce el codigo de 6 digitos junto con tu nueva contrasena.
              </p>

              {error && (
                <p className="mt-5 rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                  {error}
                </p>
              )}

              <form onSubmit={handleReset}>
                <label className="mt-8 block text-sm font-medium">
                  Codigo
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-2 w-full rounded-xl border px-4 py-3 text-center font-mono tracking-[0.3em] outline-none transition-all placeholder:text-white/40"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </label>

                <label className="mt-4 block text-sm font-medium">
                  Nueva contrasena
                  <div className="relative mt-2">
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 pr-11 outline-none transition-all placeholder:text-white/40"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((c) => !c)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={code.length !== 6 || password.length < 8 || submitting}
                  className="mt-7 w-full rounded-xl py-3 font-semibold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={primaryBtn}
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
              <h2 className="text-3xl font-bold">Contrasena actualizada</h2>
              <p className="text-sm text-white/55 mt-3 mb-7">
                Tu contrasena ha sido restablecida exitosamente.
              </p>
              <a
                href="/"
                className="inline-block rounded-xl px-8 py-3 font-semibold transition-all hover:brightness-110"
                style={primaryBtn}
              >
                Ir al dashboard
              </a>
            </div>
          )}

          {step !== "done" && (
            <Link
              href="/login"
              className="mt-6 block w-full text-center text-sm text-white/55 hover:text-white/80"
            >
              Volver al login
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
