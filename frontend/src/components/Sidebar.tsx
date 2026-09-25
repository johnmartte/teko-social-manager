"use client";

import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrandMark from "@/components/BrandMark";
import { InstagramIcon, FacebookIcon } from "@/components/PlatformIcon";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/instagram", label: "Instagram", icon: InstagramIcon },
  { href: "/facebook", label: "Facebook", icon: FacebookIcon },
  { href: "/publish", label: "Publicar", icon: PenSquare },
  { href: "/comments", label: "Comentarios", icon: MessageSquare },
  { href: "/insights", label: "Estadísticas", icon: BarChart3 },
  { href: "/automations", label: "Automatizaciones", icon: Sparkles },
  { href: "/posts", label: "Mis posts", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="flex items-center h-16 px-5">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground font-medium"
                      : "text-sidebar-muted hover:text-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-4 pt-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors",
            isActive("/settings")
              ? "bg-sidebar-accent text-foreground font-medium"
              : "text-sidebar-muted hover:text-foreground hover:bg-sidebar-accent/60"
          )}
        >
          <Settings className="size-4 shrink-0" strokeWidth={1.75} />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
