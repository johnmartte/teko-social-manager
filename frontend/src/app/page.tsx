"use client";

import { useAuth } from "@/context/AuthContext";
import Card, { StatCard } from "@/components/Card";
import { getLoginUrl, formatNum, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { InstagramProfile, FacebookPage } from "@/lib/types";

export default function DashboardPage() {
  const { status, loading } = useAuth();

  if (loading) return <DashboardSkeleton />;

  const connected =
    status?.instagram.connected || status?.facebook.connected;

  if (!connected) return <ConnectPrompt />;

  return <DashboardContent />;
}

function ConnectPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-[#7c3aed] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Bienvenido a Teko Social</h1>
        <p className="text-muted mb-6 text-sm">
          Conecta tu cuenta de Instagram Business o Creator para empezar a
          gestionar tus redes sociales desde un solo lugar.
        </p>
        <a
          href={getLoginUrl()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-[#7c3aed] text-white px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Conectar con Instagram / Facebook
        </a>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { status } = useAuth();
  const [igProfile, setIgProfile] = useState<InstagramProfile | null>(null);
  const [fbPage, setFbPage] = useState<FacebookPage | null>(null);

  useEffect(() => {
    if (status?.instagram.connected) {
      api<InstagramProfile>("/instagram/profile")
        .then(setIgProfile)
        .catch(() => {});
    }
    if (status?.facebook.connected) {
      api<FacebookPage>("/facebook/page")
        .then(setFbPage)
        .catch(() => {});
    }
  }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          Hola{igProfile ? `, @${igProfile.username}` : ""}
        </h1>
        <p className="text-muted text-sm mt-1">
          Este es el resumen de tus cuentas conectadas.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {igProfile && (
          <>
            <StatCard
              label="Seguidores en Instagram"
              value={formatNum(igProfile.followers_count)}
              color="#e1306c"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>}
            />
            <StatCard
              label="Posts en Instagram"
              value={formatNum(igProfile.media_count)}
              color="#f5a623"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>}
            />
          </>
        )}
        {fbPage && (
          <>
            <StatCard
              label="Fans en Facebook"
              value={formatNum(fbPage.fan_count)}
              color="#1877f2"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>}
            />
            <StatCard
              label="Seguidores en Facebook"
              value={formatNum(fbPage.followers_count)}
              color="#22c55e"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>}
            />
          </>
        )}
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {igProfile && (
          <Card title="Instagram" color="#e1306c">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-[#fcaf45] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {igProfile.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{igProfile.name || igProfile.username}</p>
                <p className="text-xs text-muted">@{igProfile.username}</p>
                {igProfile.biography && <p className="text-xs text-muted mt-1 truncate">{igProfile.biography}</p>}
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-lg font-bold">{formatNum(igProfile.followers_count)}</p>
                <p className="text-xs text-muted">Seguidores</p>
              </div>
              <div>
                <p className="text-lg font-bold">{formatNum(igProfile.media_count)}</p>
                <p className="text-xs text-muted">Publicaciones</p>
              </div>
            </div>
          </Card>
        )}

        {fbPage && (
          <Card title="Facebook" color="#1877f2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fb to-[#42b0ff] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {fbPage.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{fbPage.name}</p>
                <p className="text-xs text-muted">ID: {fbPage.id}</p>
                {fbPage.about && <p className="text-xs text-muted mt-1 truncate">{fbPage.about}</p>}
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-lg font-bold">{formatNum(fbPage.fan_count)}</p>
                <p className="text-xs text-muted">Me gusta</p>
              </div>
              <div>
                <p className="text-lg font-bold">{formatNum(fbPage.followers_count)}</p>
                <p className="text-xs text-muted">Seguidores</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <Card title="Acciones rápidas">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/publish" label="Publicar foto" color="#e1306c" icon="📷" />
          <QuickAction href="/publish" label="Publicar Reel" color="#f5a623" icon="🎬" />
          <QuickAction href="/insights" label="Ver estadísticas" color="#22c55e" icon="📊" />
          <QuickAction href="/comments" label="Comentarios" color="#1877f2" icon="💬" />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ href, label, color, icon }: { href: string; label: string; color: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-foreground/10 hover:bg-card-hover transition-all text-center"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-border rounded-lg" />
      <div className="h-4 w-64 bg-border rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-border rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
