"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

export default function LoginPage() {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await loginWithEmail(email.trim(), password);
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesion";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-5xl font-bold leading-tight">Gestiona tus redes desde un solo lugar.</h1>
          <p className="mt-5 text-lg text-white/55">
            Contenido, conversaciones y analitica de Instagram y Facebook, unificados.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-3xl border p-8"
          style={{
            borderColor: "rgba(255,255,255,0.1)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          }}
        >
          <img src="/logos/Isologo-White.svg" alt="TEKO" className="mb-10 h-8 w-auto lg:hidden" />
          <p className="text-sm font-medium text-[#1ec4ff]">Bienvenido</p>
          <h2 className="mt-1 text-3xl font-bold">Inicia sesion</h2>
          <p className="mt-2 text-sm text-white/50">Ingresa con tus credenciales personales de acceso.</p>

          {error && (
            <p
              className="mt-5 rounded-xl border p-3 text-sm"
              style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.1)", color: "#f87171" }}
            >
              {error}
            </p>
          )}

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
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#f2f3f5" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(30,196,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30,196,255,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            Contrasena
            <div className="relative mt-2">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 pr-11 outline-none transition-all placeholder:text-white/40"
                style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#f2f3f5" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(30,196,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30,196,255,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-7 w-full rounded-xl py-3 font-semibold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#1ec4ff", color: "#080a0f", boxShadow: "0 8px 24px -6px rgba(30,196,255,0.45)" }}
          >
            {submitting ? "Ingresando..." : "Iniciar sesion"}
          </button>

          <Link
            href="/forgot-password"
            className="mt-6 block w-full text-center text-sm text-white/55 hover:text-white/80"
          >
            Olvidaste tu contrasena?
          </Link>

          <p className="mt-3 text-center text-sm text-white/55">
            No tienes cuenta?{" "}
            <Link href="/register" className="text-white/90 hover:text-white underline underline-offset-2">
              Registrate
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
