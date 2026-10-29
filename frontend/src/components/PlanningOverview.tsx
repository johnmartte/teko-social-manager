"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Campaign, ScheduledPost } from "@/lib/types";

const TYPE_TONE: Record<ScheduledPost["type"], string> = {
  photo: "var(--lilac)",
  reel: "var(--rose)",
  carousel: "var(--sky)",
  text: "var(--butter)",
};
const TYPE_LABEL: Record<ScheduledPost["type"], string> = {
  photo: "Foto",
  reel: "Reel",
  carousel: "Carrusel",
  text: "Texto",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Semana en curso + estado del plan. Funciona sin cuentas conectadas: solo usa el API propio. */
export default function PlanningOverview() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    api<ScheduledPost[]>("/scheduled-posts").then(setPosts).catch(() => {});
    api<Campaign[]>("/campaigns").then(setCampaigns).catch(() => {});
  }, []);

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const campaignById = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const dated = posts.filter((p) => p.scheduled_at && p.status !== "published");
  const failed = posts.filter((p) => p.status === "failed");
  const drafts = posts.filter((p) => p.status === "draft").length;
  const pending = posts.filter((p) => p.status === "pending").length;

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="teko-card p-5 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold">Próximos 7 días</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pending} programados · {drafts} borradores
            </p>
          </div>
          <Link href="/planner" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Calendario <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-2 overflow-x-auto">
          {days.map((d, i) => {
            const dayPosts = dated
              .filter((p) => startOfDay(new Date(p.scheduled_at!)).getTime() === d.getTime())
              .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));
            return (
              <div key={d.toISOString()} className="min-w-[96px]">
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2.5 mb-2 flex items-baseline gap-1.5",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <span className="text-[11px] capitalize opacity-70">
                    {d.toLocaleDateString("es", { weekday: "short" })}
                  </span>
                  <span className="text-xl font-semibold tabular-nums leading-none">{d.getDate()}</span>
                </div>
                <div className="space-y-1.5 min-h-[150px] rounded-2xl border border-dashed border-border p-1.5">
                  {dayPosts.map((p) => {
                    const c = p.campaign_id ? campaignById.get(p.campaign_id) : undefined;
                    return (
                      <Link
                        key={p.id}
                        href="/feed"
                        className={cn("block rounded-xl p-2 text-ink", p.status === "draft" && "opacity-60")}
                        style={{ background: c?.color ?? TYPE_TONE[p.type] }}
                      >
                        <p className="text-[10.5px] font-semibold tabular-nums">
                          {new Date(p.scheduled_at!).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[11px] leading-snug line-clamp-2 mt-0.5">{p.caption || TYPE_LABEL[p.type]}</p>
                        {p.status === "draft" && <p className="text-[9.5px] mt-1 opacity-70">Borrador</p>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {failed.length > 0 && (
          <Link href="/planner" className="flex items-start gap-3 rounded-[18px] border border-error-border bg-error-light p-4">
            <AlertTriangle className="size-4 text-error mt-0.5 shrink-0" />
            <span className="text-sm">
              <span className="font-medium text-error">{failed.length} publicación{failed.length > 1 ? "es" : ""} falló.</span>{" "}
              <span className="text-muted-foreground">Revisa el error y vuelve a intentarlo.</span>
            </span>
          </Link>
        )}

        <div className="teko-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold">Campañas</h2>
            <Link href="/feed?new=campaign" className="text-xs text-muted-foreground hover:text-foreground">Nueva</Link>
          </div>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Agrupa posts en campañas desde Feed y campañas.</p>
          ) : (
            <ul className="space-y-2.5">
              {campaigns.slice(0, 4).map((c) => {
                const own = posts.filter((p) => p.campaign_id === c.id);
                const ready = own.filter((p) => p.status !== "draft").length;
                return (
                  <li key={c.id}>
                    <Link href={`/feed?campaign=${c.id}`} className="block rounded-2xl p-3.5 text-ink" style={{ background: c.color }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold truncate">{c.name}</span>
                        <span className="text-[11px] tabular-nums opacity-70">{ready}/{own.length}</span>
                      </div>
                      <div className="mt-2.5 h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <div className="h-full rounded-full bg-ink" style={{ width: own.length ? `${(ready / own.length) * 100}%` : 0 }} />
                      </div>
                      {c.ends_on && (
                        <p className="text-[11px] mt-2 opacity-70">
                          Termina el {new Date(c.ends_on + "T12:00").toLocaleDateString("es", { day: "numeric", month: "long" })}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
