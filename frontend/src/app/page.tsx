"use client";

import { useAuth } from "@/context/AuthContext";
import Card, { StatCard } from "@/components/Card";
import { getLoginUrl, formatNum, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { InstagramProfile, FacebookPage } from "@/lib/types";
import SocialLogo from "@/components/SocialLogo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, ArrowUpRight } from "lucide-react";
import PlanningOverview from "@/components/PlanningOverview";

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

  if (!connected) {
    return (
      <div className="space-y-5 teko-enter">
        <ConnectPrompt />
        <PlanningOverview />
      </div>
    );
  }

  return <DashboardContent />;
}

function ConnectPrompt() {
  return (
    <div className="teko-card flex flex-col sm:flex-row sm:items-center gap-4 p-5">
      <div className="size-11 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0">
        <Link2 className="size-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <h2 className="text-[15px] font-semibold">Conecta Instagram y Facebook</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Puedes planificar sin conectar; para programar, publicar y ver estadísticas hace falta vincular tus cuentas.
        </p>
      </div>
      <Button asChild className="h-10 rounded-full px-5">
        <a href={getLoginUrl()}>Conectar cuentas</a>
      </Button>
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
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Hola{igProfile ? `, @${igProfile.username}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Gestiona publicaciones, conversaciones y rendimiento de tus cuentas
              desde una vista unificada.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:max-w-140 teko-stagger">
            {igProfile && (
              <StatCard label="Seguidores IG" value={formatNum(igProfile.followers_count)} />
            )}
            {igProfile && (
              <StatCard label="Posts IG" value={formatNum(igProfile.media_count)} />
            )}
            {fbPage && (
              <StatCard label="Fans FB" value={formatNum(fbPage.fan_count)} />
            )}
            {fbPage && (
              <StatCard label="Seguidores FB" value={formatNum(fbPage.followers_count)} />
            )}
          </div>
      </section>

      <PlanningOverview />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Tareas del dia" className="xl:col-span-2">
          <div className="space-y-2">
            {dailyTasks.length > 0 ? dailyTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.owner} • {task.due}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
                  {task.tag}
                </span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-5">No hay tareas programadas por ahora.</p>
            )}
          </div>
        </Card>

        <Card title="Ritmo de equipo">
          <div className="space-y-4">
            <div className="rounded-lg p-4 bg-muted border border-border">
              <p className="text-xs text-muted-foreground">Cumplimiento diario</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{teamMetrics.completion}%</p>
              <p className="text-xs text-muted-foreground mt-1">Basado en publicaciones pendientes y completadas.</p>
            </div>
            <div className="rounded-lg p-4 bg-muted border border-border">
              <p className="text-xs text-muted-foreground">Tiempo medio de respuesta</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{teamMetrics.response_minutes} min</p>
              <p className="text-xs text-muted-foreground mt-1">Objetivo: menor a 30 min</p>
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
            <p className="text-sm text-muted-foreground col-span-4 text-center py-6">
              Sin herramientas disponibles por ahora.
            </p>
          )}
        </div>
      </Card>
    </div>
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
      <div className="flex items-center gap-3">
        <SocialLogo platform={platform} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{handle}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{description}</p>
      <div className="flex gap-8 mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-lg font-semibold tabular-nums">{primary}</p>
          <p className="text-xs text-muted-foreground">{primaryLabel}</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">{secondary}</p>
          <p className="text-xs text-muted-foreground">{secondaryLabel}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint: string;
  color?: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-lg border border-border hover:bg-accent transition-colors px-4 py-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.75} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-60 rounded-xl" />
    </div>
  );
}
