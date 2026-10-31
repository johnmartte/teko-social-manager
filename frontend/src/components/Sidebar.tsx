"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  Inbox,
  PenSquare,
  MessageSquare,
  BarChart3,
  Sparkles,
  FileText,
  Settings,
  Grid3x3,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Campaign } from "@/lib/types";
import BrandMark from "@/components/BrandMark";
import PoweredBy from "@/components/PoweredBy";
import { InstagramIcon, FacebookIcon } from "@/components/PlatformIcon";

export const navGroups = [
  {
    label: "Planificar",
    items: [
      { href: "/", label: "Resumen", icon: LayoutGrid },
      { href: "/feed", label: "Feed y campañas", icon: Grid3x3 },
      { href: "/planner", label: "Calendario", icon: CalendarDays },
      { href: "/publish", label: "Publicar", icon: PenSquare },
    ],
  },
  {
    label: "Comunidad",
    items: [
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/comments", label: "Comentarios", icon: MessageSquare },
      { href: "/automations", label: "Automatizaciones", icon: Sparkles },
    ],
  },
  {
    label: "Canales",
    items: [
      { href: "/instagram", label: "Instagram", icon: InstagramIcon },
      { href: "/facebook", label: "Facebook", icon: FacebookIcon },
      { href: "/insights", label: "Estadísticas", icon: BarChart3 },
      { href: "/posts", label: "Publicados", icon: FileText },
    ],
  },
  {
    label: "Soporte",
    items: [{ href: "/help", label: "Ayuda y manual", icon: LifeBuoy }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    api<Campaign[]>("/campaigns").then(setCampaigns).catch(() => setCampaigns([]));
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-2 h-[calc(100vh-16px)] w-[68px] lg:w-64 shrink-0 rounded-[22px] bg-sidebar border border-sidebar-border flex flex-col">
      <div className="flex items-center h-[72px] px-4 lg:px-5">
        <BrandMark showName={false} className="lg:hidden" />
        <BrandMark className="hidden lg:flex" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 lg:px-3 pb-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="hidden lg:block px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="hidden lg:block mt-2">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/70">Campañas</p>
            <Link href="/feed?new=campaign" aria-label="Nueva campaña" className="text-sidebar-muted hover:text-foreground">
              <Plus className="size-3.5" />
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <p className="px-3 text-xs text-sidebar-muted">Aún no hay campañas.</p>
          ) : (
            <ul className="space-y-0.5">
              {campaigns.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/feed?campaign=${c.id}`}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] text-sidebar-muted hover:text-foreground hover:bg-sidebar-accent/60"
                  >
                    <span className="size-2.5 rounded-[3px] shrink-0" style={{ background: c.color }} />
                    <span className="truncate flex-1">{c.name}</span>
                    <span className="text-[11px] tabular-nums opacity-60">{c.posts_count ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      <div className="p-2.5 lg:p-3 border-t border-sidebar-border space-y-2">
        <Link
          href="/publish"
          className="hidden lg:flex items-center gap-3 rounded-2xl border border-dashed border-sidebar-border p-3 hover:border-ring transition-colors"
        >
          <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Plus className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-medium">Nueva publicación</span>
            <span className="block text-[11px] text-sidebar-muted">Foto, reel o carrusel</span>
          </span>
        </Link>
        <NavLink href="/settings" label="Configuración" icon={Settings} active={isActive("/settings")} />
        <PoweredBy className="hidden lg:block px-3 pt-1 text-sidebar-muted" />
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center justify-center lg:justify-start gap-3 h-9 px-3 rounded-xl text-[13.5px] transition-colors",
        active
          ? "bg-sidebar-accent text-foreground font-medium shadow-[inset_0_1px_0_rgba(255,255,255,.05)]"
          : "text-sidebar-muted hover:text-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={1.6} />
      <span className="hidden lg:inline flex-1 truncate">{label}</span>
      {active && <span className="glow-dot absolute right-1.5 top-1.5 lg:static" />}
    </Link>
  );
}
