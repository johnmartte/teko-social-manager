"use client";

import { useAuth } from "@/context/AuthContext";
import { getLoginUrl } from "@/lib/api";

export default function Header() {
  const { status, logout } = useAuth();

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;
  const anyConnected = igConnected || fbConnected;

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card/60 backdrop-blur-sm border-b border-border">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-background rounded-xl px-4 py-2.5 w-full border border-border">
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
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              igConnected
                ? "bg-accent-light text-accent"
                : "bg-background text-muted border border-border"
            }`}
          >
            Instagram {igConnected ? "conectado" : "desconectado"}
          </span>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              fbConnected
                ? "bg-fb-light text-fb"
                : "bg-background text-muted border border-border"
            }`}
          >
            Facebook{" "}
            {fbConnected
              ? status?.facebook.pageName || "conectado"
              : "desconectado"}
          </span>
        </div>

        {/* Auth button */}
        {anyConnected ? (
          <button
            onClick={logout}
            className="text-xs px-4 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            Cerrar sesión
          </button>
        ) : (
          <a
            href={getLoginUrl()}
            className="text-xs px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            Conectar cuentas
          </a>
        )}

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-warning to-accent flex items-center justify-center text-white text-sm font-bold">
          T
        </div>
      </div>
    </header>
  );
}
