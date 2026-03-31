"use client";

import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { getLoginUrl } from "@/lib/api";

export default function SettingsPage() {
  const { status, logout } = useAuth();

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Configuración</h1>

      <Card title="Cuentas conectadas">
        <div className="space-y-3">
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
                  {igConnected ? `ID: ${status?.instagram.userId}` : "No conectado"}
                </p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${igConnected ? "bg-success-light text-green-700" : "bg-red-50 text-red-500"}`}>
              {igConnected ? "Activo" : "Inactivo"}
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
                  {fbConnected ? `${status?.facebook.pageName} (${status?.facebook.pageId})` : "No conectado"}
                </p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${fbConnected ? "bg-success-light text-green-700" : "bg-red-50 text-red-500"}`}>
              {fbConnected ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-5 flex-wrap">
          <a
            href={getLoginUrl()}
            className="text-xs px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            {igConnected || fbConnected ? "Reconectar cuentas" : "Conectar cuentas"}
          </a>
          {(igConnected || fbConnected) && (
            <button
              onClick={logout}
              className="text-xs px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              Desconectar todo
            </button>
          )}
        </div>
      </Card>

      {/* Guide: how to connect Instagram */}
      {fbConnected && !igConnected && (
        <Card title="Cómo conectar Instagram" color="#e1306c">
          <p className="text-sm text-muted mb-4">
            Instagram aparece desconectado porque tu página de Facebook <strong className="text-foreground">{status?.facebook.pageName}</strong> no tiene una cuenta de Instagram Business o Creator vinculada.
          </p>
          <ol className="space-y-3">
            {[
              {
                n: 1,
                title: "Convierte tu cuenta de Instagram a Business o Creator",
                desc: "Ve a Instagram → Configuración → Cuenta → Cambiar tipo de cuenta.",
              },
              {
                n: 2,
                title: "Vincula Instagram a tu página de Facebook",
                desc: 'Ve a Meta Business Suite (business.facebook.com) → Configuración → Cuentas de Instagram → Conectar cuenta.',
              },
              {
                n: 3,
                title: "Reconecta la app",
                desc: 'Haz click en "Reconectar cuentas" arriba para volver a autorizar con los nuevos permisos.',
              },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {n}
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 pt-4 border-t border-border">
            <a
              href="https://business.facebook.com/settings/instagram-accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent font-medium hover:underline"
            >
              Ir a Meta Business Suite
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </Card>
      )}

      {!fbConnected && !igConnected && (
        <Card title="Para empezar">
          <p className="text-sm text-muted">
            Conecta tu cuenta de Facebook para comenzar. Instagram se detectará automáticamente si tienes una cuenta Business/Creator vinculada a tu página.
          </p>
        </Card>
      )}

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
