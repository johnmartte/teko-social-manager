"use client";

import { useAuth } from "@/context/AuthContext";
import { getLoginUrl } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { status, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;
  const anyConnected = igConnected || fbConnected;

  const initial = (user?.name || "T").charAt(0).toUpperCase();

  return (
    <header className="h-20 flex items-center justify-between gap-4 px-4 sm:px-8 sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-card rounded-xl px-3.5 py-2.5 w-full border border-border">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-card text-muted hover:text-foreground transition-colors"
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
        </button>

        {/* Status badges */}
        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              igConnected
                ? "bg-ig-light text-ig border-ig/20"
                : "bg-card text-muted border-border"
            }`}
          >
            IG {igConnected ? "activo" : "off"}
          </span>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              fbConnected
                ? "bg-fb-light text-fb border-fb/20"
                : "bg-card text-muted border-border"
            }`}
          >
            FB{" "}
            {fbConnected
              ? status?.facebook.pageName || "conectado"
              : "off"}
          </span>
        </div>

        {/* Auth buttons */}
        {!anyConnected && (
          <a
            href={getLoginUrl()}
            className="text-xs px-4 py-2 rounded-xl bg-accent text-white font-semibold hover:brightness-110 transition-[filter] shadow-[0_8px_24px_-6px_rgba(30,196,255,0.45)]"
          >
            Conectar cuentas
          </a>
        )}
        <button
          onClick={logout}
          className="hidden sm:inline-flex text-xs px-4 py-2 rounded-xl border border-border bg-card text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          Cerrar sesión
        </button>

        {/* Avatar */}
        <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-background text-sm font-bold shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
}
