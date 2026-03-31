"use client";

import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { getLoginUrl } from "@/lib/api";

export default function SettingsPage() {
  const { status, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Configuración</h1>

      <Card title="Cuentas conectadas">
        <div className="space-y-4">
          {/* Instagram */}
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="#e1306c" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Instagram</p>
                <p className="text-xs text-muted">
                  {status?.instagram.connected
                    ? `Conectado (ID: ${status.instagram.userId})`
                    : "No conectado"}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                status?.instagram.connected
                  ? "bg-success-light text-green-700"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {status?.instagram.connected ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Facebook */}
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fb-light flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Facebook</p>
                <p className="text-xs text-muted">
                  {status?.facebook.connected
                    ? `${status.facebook.pageName} (${status.facebook.pageId})`
                    : "No conectado"}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                status?.facebook.connected
                  ? "bg-success-light text-green-700"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {status?.facebook.connected ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <a
            href={getLoginUrl()}
            className="text-xs px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            {status?.instagram.connected ? "Reconectar" : "Conectar cuentas"}
          </a>
          {(status?.instagram.connected || status?.facebook.connected) && (
            <button
              onClick={logout}
              className="text-xs px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              Desconectar todo
            </button>
          )}
        </div>
      </Card>

      <Card title="Acerca de">
        <p className="text-sm text-muted">
          Teko Social Manager v1.0 — Sistema de gestión de redes sociales usando la API oficial de Meta.
        </p>
        <p className="text-xs text-muted mt-2">
          Backend: Laravel 13 | Frontend: Next.js + Tailwind CSS
        </p>
      </Card>
    </div>
  );
}
