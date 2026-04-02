"use client";

import { useAuth } from "@/context/AuthContext";
import { getLoginUrl } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { status, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;
  const anyConnected = igConnected || fbConnected;

  return (
    <header className="h-18 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="flex items-center gap-2 bg-card/92 rounded-2xl px-4 py-2.5 w-full border border-border shadow-[0_12px_34px_rgba(62,52,31,0.08)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9489" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted"
          />
        </div>
        <button className="hidden sm:inline-flex text-xs px-3.5 py-2.5 rounded-xl border border-border bg-card/92 hover:bg-card transition-colors">
          Hoy
        </button>
        <button className="hidden sm:inline-flex text-xs px-3.5 py-2.5 rounded-xl border border-border bg-card/92 hover:bg-card transition-colors whitespace-nowrap">
          Esta semana
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl border border-border bg-card/92 hover:bg-card transition-colors"
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
            </svg>
          )}
          <span className="hidden sm:inline">{isDark ? "Claro" : "Oscuro"}</span>
        </button>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              igConnected
                ? "bg-accent-light text-accent border-accent/20"
                : "bg-card/92 text-muted border-border"
            }`}
          >
            IG {igConnected ? "activo" : "off"}
          </span>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              fbConnected
                ? "bg-fb-light text-fb border-fb/20"
                : "bg-card/92 text-muted border-border"
            }`}
          >
            FB{" "}
            {fbConnected
              ? status?.facebook.pageName || "conectado"
              : "off"}
          </span>
        </div>

        {/* Auth button */}
        {anyConnected ? (
          <button
            onClick={logout}
            className="text-xs px-4 py-2 rounded-xl border border-border bg-card/92 text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            Cerrar sesión
          </button>
        ) : (
          <a
            href={getLoginUrl()}
            className="text-xs px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(225,48,108,0.35)]"
          >
            Conectar cuentas
          </a>
        )}

        {/* Avatar */}
        <div className="w-10 h-10 rounded-2xl bg-sidebar flex items-center justify-center shadow-[0_12px_24px_rgba(16,130,255,0.25)] overflow-hidden p-1.5">
          <img src="/logos/isotipo.svg" alt="Teko" className="w-full h-full object-contain" />
        </div>
      </div>
    </header>
  );
}
