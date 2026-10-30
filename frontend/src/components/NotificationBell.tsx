"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Bell, CalendarClock, CheckCircle2, Link2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ScheduledPost } from "@/lib/types";

type Notice = { id: string; icon: typeof Bell; color: string; title: string; text: string; at: number; href: string };

const SEEN_KEY = "teko_notif_seen";
const DAY = 24 * 60 * 60 * 1000;

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function ago(ms: number, now: number) {
  const m = Math.round((now - ms) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
}

function inFuture(ms: number, now: number) {
  const m = Math.round((ms - now) / 60000);
  return m < 60 ? `en ${Math.max(m, 1)} min` : `en ${Math.round(m / 60)} h`;
}

const snippet = (p: ScheduledPost) => p.caption?.trim().slice(0, 60) || "Post sin texto";

/** Avisos calculados con los datos del sistema: fallos, próximas publicaciones, publicaciones recientes y conexión. */
export default function NotificationBell() {
  const { status } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [seen, setSeen] = useState<string[]>(() => (typeof window === "undefined" ? [] : readSeen()));
  const [now, setNow] = useState(0); // se fija al refrescar: así el render no depende del reloj

  const refresh = useCallback(() => {
    api<ScheduledPost[]>("/scheduled-posts")
      .then((p) => {
        setPosts(p);
        setNow(Date.now());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

  const notices = useMemo<Notice[]>(() => {
    const out: Notice[] = [];

    if (status && !status.instagram.connected && !status.facebook.connected) {
      out.push({ id: "connect", icon: Link2, color: "#d9a47a", title: "Conecta tus cuentas", text: "Enlaza Instagram o Facebook para publicar y ver tus mensajes.", at: now, href: "/settings" });
    }

    for (const p of posts) {
      const updated = new Date(p.updated_at).getTime();
      const when = p.scheduled_at ? new Date(p.scheduled_at).getTime() : 0;
      if (p.status === "failed") {
        out.push({ id: `failed-${p.id}-${p.updated_at}`, icon: AlertCircle, color: "#f0716a", title: "No se pudo publicar", text: p.error_message || snippet(p), at: updated, href: `/feed?post=${p.id}` });
      } else if (p.status === "pending" && when > now && when - now < DAY) {
        out.push({ id: `soon-${p.id}-${p.scheduled_at}`, icon: CalendarClock, color: "#d9a47a", title: `Se publica ${inFuture(when, now)}`, text: snippet(p), at: now, href: `/feed?post=${p.id}` });
      } else if (p.status === "published" && now - updated < DAY) {
        out.push({ id: `done-${p.id}`, icon: CheckCircle2, color: "#6fcf97", title: "Publicado", text: snippet(p), at: updated, href: "/posts" });
      }
    }
    return out.sort((a, b) => b.at - a.at).slice(0, 15);
  }, [posts, status, now]);

  const unread = notices.filter((n) => !seen.includes(n.id)).length;

  function markSeen(ids: string[]) {
    const next = [...new Set([...seen, ...ids])].slice(-200);
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {}
  }

  return (
    <DropdownMenu onOpenChange={(o) => o && refresh()}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}>
          <Bell className="size-4" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-[#f0716a] px-1 text-[10px] font-semibold leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5">
        <DropdownMenuLabel className="flex items-center justify-between font-normal">
          <span className="text-sm font-medium">Notificaciones</span>
          {unread > 0 && (
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => markSeen(notices.map((n) => n.id))}>
              Marcar todo como leído
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notices.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No tienes avisos nuevos.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notices.map((n) => {
              const isNew = !seen.includes(n.id);
              return (
                <DropdownMenuItem key={n.id} asChild>
                  <Link href={n.href} onClick={() => markSeen([n.id])} className="flex items-start gap-3 rounded-xl px-3 py-2.5">
                    <n.icon className="mt-0.5 size-4 shrink-0" style={{ color: n.color }} strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${isNew ? "font-semibold" : ""}`}>{n.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{n.text}</span>
                      <span className="block text-[11px] text-muted-foreground/70">{ago(n.at, now)}</span>
                    </span>
                    {isNew && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
