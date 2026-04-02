"use client";

import { useAuth } from "@/context/AuthContext";
import Card, { StatCard } from "@/components/Card";
import { getLoginUrl, formatNum, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { InstagramProfile, FacebookPage } from "@/lib/types";
import SocialLogo from "@/components/SocialLogo";

type SocialTask = {
  id: string;
  title: string;
  owner: string;
  tag: "Contenido" | "Moderacion" | "Ads" | "Comunidad";
  due: string;
};

type DashboardWorkspaceData = {
  tasks: SocialTask[];
  metrics: {
    completion: number;
    response_minutes: number;
  };
  quick_actions?: Array<{
    href: string;
    label: string;
    hint: string;
    color: string;
  }>;
};

export default function DashboardPage() {
  const { status, loading } = useAuth();

  if (loading) return <DashboardSkeleton />;

  const connected = status?.instagram.connected || status?.facebook.connected;

  if (!connected) return <ConnectPrompt />;

  return <DashboardContent />;
}

function ConnectPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] teko-enter">
      <div className="w-full max-w-xl rounded-[34px] border border-border bg-card/95 px-8 py-10 shadow-[0_32px_60px_rgba(64,48,21,0.14)] text-center relative overflow-hidden">
        <div className="absolute -left-10 -top-12 w-40 h-40 rounded-full bg-accent-light/70 blur-2xl" />
        <div className="absolute -right-10 -bottom-14 w-48 h-48 rounded-full bg-fb-light/70 blur-2xl" />

        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-linear-to-br from-accent to-[#f39f1f] flex items-center justify-center shadow-[0_16px_34px_rgba(225,48,108,0.34)] relative z-10">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-2 relative z-10">Centro de control social</h1>
        <p className="text-muted mb-8 text-sm max-w-md mx-auto relative z-10">
          Conecta Instagram y Facebook para activar el tablero avanzado de contenido,
          comentarios, automatizaciones y analitica en un solo flujo.
        </p>
        <a
          href={getLoginUrl()}
          className="inline-flex items-center gap-2 bg-linear-to-r from-accent to-[#f39f1f] text-white px-7 py-3.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-[0_12px_28px_rgba(225,48,108,0.34)] relative z-10"
        >
          Conectar Instagram y Facebook
        </a>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { status } = useAuth();
  const [igProfile, setIgProfile] = useState<InstagramProfile | null>(null);
  const [fbPage, setFbPage] = useState<FacebookPage | null>(null);
  const [dailyTasks, setDailyTasks] = useState<SocialTask[]>([]);
  const [teamMetrics, setTeamMetrics] = useState({ completion: 0, response_minutes: 19 });
  const [quickActions, setQuickActions] = useState<DashboardWorkspaceData["quick_actions"]>([]);

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

    api<DashboardWorkspaceData>("/workspace/dashboard")
      .then((data) => {
        setDailyTasks(data.tasks || []);
        setTeamMetrics(data.metrics || { completion: 0, response_minutes: 19 });
        setQuickActions(data.quick_actions || []);
      })
      .catch(() => {
        setDailyTasks([]);
      });
  }, [status]);

  return (
    <div className="space-y-6 teko-enter">
      <section className="rounded-[34px] border border-border bg-card/95 px-6 py-6 sm:px-8 relative overflow-hidden shadow-[0_24px_56px_rgba(75,58,28,0.1)]">
        <div className="absolute -right-10 -top-5 h-40 w-40 rounded-full bg-fb-light/70 blur-2xl" />
        <div className="absolute -left-8 -bottom-11 h-44 w-44 rounded-full bg-warning-light/70 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted font-semibold">Panel diario</p>
            <h1 className="text-3xl font-bold mt-1">
              Hola{igProfile ? `, @${igProfile.username}` : ""}
            </h1>
            <p className="text-sm text-muted mt-1 max-w-xl">
              Gestiona publicaciones, conversaciones y rendimiento de tus cuentas
              desde una vista unificada.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:max-w-140 teko-stagger">
            {igProfile && (
              <StatCard
                label="Seguidores IG"
                value={formatNum(igProfile.followers_count)}
                color="#e1306c"
                icon={<DotIcon color="#e1306c" />}
              />
            )}
            {igProfile && (
              <StatCard
                label="Posts IG"
                value={formatNum(igProfile.media_count)}
                color="#e8a126"
                icon={<DotIcon color="#e8a126" />}
              />
            )}
            {fbPage && (
              <StatCard
                label="Fans FB"
                value={formatNum(fbPage.fan_count)}
                color="#1877f2"
                icon={<DotIcon color="#1877f2" />}
              />
            )}
            {fbPage && (
              <StatCard
                label="Seguidores FB"
                value={formatNum(fbPage.followers_count)}
                color="#22c55e"
                icon={<DotIcon color="#22c55e" />}
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Tareas del dia" className="xl:col-span-2">
          <div className="space-y-2">
            {dailyTasks.length > 0 ? dailyTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-2xl border border-border bg-background/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{task.title}</p>
                  <p className="text-xs text-muted mt-0.5">{task.owner} • {task.due}</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-card border border-border text-muted">
                  {task.tag}
                </span>
              </div>
            )) : (
              <p className="text-sm text-muted text-center py-5">No hay tareas programadas por ahora.</p>
            )}
          </div>
        </Card>

        <Card title="Ritmo de equipo">
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-accent-light/70 border border-accent/10">
              <p className="text-xs text-muted">Cumplimiento diario</p>
              <p className="text-3xl font-bold mt-1">{teamMetrics.completion}%</p>
              <p className="text-xs text-muted mt-1">Basado en publicaciones pendientes y completadas.</p>
            </div>
            <div className="rounded-2xl p-4 bg-fb-light/70 border border-fb/10">
              <p className="text-xs text-muted">Tiempo medio de respuesta</p>
              <p className="text-2xl font-bold mt-1">{teamMetrics.response_minutes} min</p>
              <p className="text-xs text-muted mt-1">Objetivo: menor a 30 min</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AccountPreviewCard
          title="Instagram"
          handle={igProfile?.username ? `@${igProfile.username}` : "Cuenta conectada"}
          primary={formatNum(igProfile?.followers_count)}
          primaryLabel="Seguidores"
          secondary={formatNum(igProfile?.media_count)}
          secondaryLabel="Publicaciones"
          description={igProfile?.biography || "Optimiza alcance, formato y horarios de publicación."}
        />

        <AccountPreviewCard
          title="Facebook"
          handle={fbPage?.name || "Pagina conectada"}
          primary={formatNum(fbPage?.fan_count)}
          primaryLabel="Me gusta"
          secondary={formatNum(fbPage?.followers_count)}
          secondaryLabel="Seguidores"
          description={fbPage?.about || "Gestiona engagement de comunidad y pauta activa."}
        />
      </section>

      <Card title="Herramientas de administracion social">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 teko-stagger">
          {quickActions && quickActions.length > 0 ? quickActions.map((action) => (
            <QuickAction
              key={action.href}
              href={action.href}
              label={action.label}
              hint={action.hint}
              color={action.color}
            />
          )) : (
            <p className="text-sm text-muted col-span-4 text-center py-6">
              Sin herramientas disponibles por ahora.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function DotIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.8" fill={color} stroke="none" />
    </svg>
  );
}

function AccountPreviewCard({
  title,
  handle,
  primary,
  primaryLabel,
  secondary,
  secondaryLabel,
  description,
}: {
  title: string;
  handle: string;
  primary: string;
  primaryLabel: string;
  secondary: string;
  secondaryLabel: string;
  description: string;
}) {
  const platform = title.toLowerCase() === "facebook" ? "facebook" : "instagram";
  return (
    <Card>
      <div className="flex items-center gap-4">
        <SocialLogo platform={platform} size="md" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted">{handle}</p>
        </div>
      </div>
      <p className="text-xs text-muted mt-3">{description}</p>
      <div className="flex gap-7 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-lg font-bold">{primary}</p>
          <p className="text-xs text-muted">{primaryLabel}</p>
        </div>
        <div>
          <p className="text-lg font-bold">{secondary}</p>
          <p className="text-xs text-muted">{secondaryLabel}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  href,
  label,
  hint,
  color,
}: {
  href: string;
  label: string;
  hint: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-border bg-background/75 hover:bg-card transition-colors px-4 py-4"
    >
      <div className="w-9 h-9 rounded-xl" style={{ backgroundColor: `${color}1e` }} />
      <p className="text-sm font-semibold mt-3">{label}</p>
      <p className="text-xs text-muted mt-1">{hint}</p>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-60 bg-border rounded-lg" />
      <div className="h-4 w-72 bg-border rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-border rounded-3xl" />
        ))}
      </div>
      <div className="h-60 bg-border rounded-3xl" />
    </div>
  );
}
