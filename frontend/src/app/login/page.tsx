"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

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
        <path
          d="M3 12s3.8-6 9-6 9 6 9 6-3.8 6-9 6-9-6-9-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12s3.8-6 9-6 9 6 9 6-3.8 6-9 6-9-6-9-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const { loginWithEmail } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <section className="relative min-h-screen w-full overflow-hidden">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-black/20 px-3 py-2 text-xs text-white backdrop-blur-md hover:bg-black/30"
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
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

          <h1 className="text-[37px] leading-none font-semibold text-center tracking-[-0.02em]">
            Inicia con tu email
          </h1>

          <p className="text-center text-sm text-white/80 mt-3 mb-6 leading-6">
            Inicia sesion de forma segura usando tus credenciales personales de acceso.
            Recuerda no compartirlas con nadie
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/90 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-[9px] border border-white/32 bg-white/18 px-3 text-[15px] text-white placeholder:text-white/55 outline-none focus:border-white/65"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-1.5">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-[9px] border border-white/32 bg-white/18 px-3 pr-11 text-[15px] text-white placeholder:text-white/55 outline-none focus:border-white/65"
                  autoComplete="current-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            {error ? <p className="text-[13px] text-red-200">{error}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="mt-3 h-11 w-full rounded-[9px] bg-[#222533] text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Ingresando..." : "Iniciar Sesion"}
            </button>
          </form>

          <button
            type="button"
            className="mt-6 w-full text-center text-white/65 hover:text-white/80 text-sm"
          >
            Olvidaste tu contrasena?
          </button>
        </div>
      </div>
    </section>
  );
}
