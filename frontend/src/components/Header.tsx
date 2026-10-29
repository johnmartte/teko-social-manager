"use client";

import { useAuth } from "@/context/AuthContext";
import { getLoginUrl } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Search, Sun, Moon, User, Settings, LogOut, Link2, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { navGroups } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function Header() {
  const { status, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;
  const anyConnected = igConnected || fbConnected;

  const initial = (user?.name || "U").charAt(0).toUpperCase();
  const pathname = usePathname();
  const current = navGroups
    .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
    .find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)));
  const title = current?.label ?? (pathname.startsWith("/settings") ? "Configuración" : "");

  return (
    <header className="h-[72px] flex items-center justify-between gap-4 px-4 sm:px-7 sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none mb-1.5">{current?.group ?? "Cuenta"}</p>
        <p className="text-[19px] font-semibold tracking-tight leading-none truncate" aria-hidden>{title}</p>
      </div>

      <div className="flex items-center gap-2">
        <label className="hidden xl:flex items-center gap-2 h-10 w-64 rounded-full border border-input bg-card px-4 focus-within:border-ring">
          <Search className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Buscar posts, campañas…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </label>

        <div className="hidden md:flex items-center gap-1.5">
          <ConnectionPill label="Instagram" connected={!!igConnected} />
          <ConnectionPill
            label={fbConnected ? status?.facebook.pageName || "Facebook" : "Facebook"}
            connected={!!fbConnected}
          />
        </div>

        {!anyConnected && (
          <Button asChild variant="outline" className="h-10 rounded-full px-4">
            <a href={getLoginUrl()}>
              <Link2 className="size-4" strokeWidth={1.75} />
              Conectar
            </a>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full"
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? (
            <Sun className="size-4" strokeWidth={1.75} />
          ) : (
            <Moon className="size-4" strokeWidth={1.75} />
          )}
        </Button>

        <Link
          href="/publish"
          className="hidden sm:inline-flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span className="size-7 rounded-full bg-background/10 flex items-center justify-center">
            <Plus className="size-4" />
          </span>
          Crear
        </Link>

        {/* Menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="size-10 rounded-full bg-gradient-to-br from-peach to-rose text-ink ring-2 ring-border flex items-center justify-center text-sm font-semibold hover:ring-ring transition"
              aria-label="Menú de usuario"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium truncate">{user?.name || "Usuario"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="size-4" strokeWidth={1.75} />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="size-4" strokeWidth={1.75} />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {isDark ? <Sun className="size-4" strokeWidth={1.75} /> : <Moon className="size-4" strokeWidth={1.75} />}
              Tema {isDark ? "claro" : "oscuro"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4" strokeWidth={1.75} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function ConnectionPill({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 h-10 rounded-full border border-border bg-card px-3.5 text-xs text-muted-foreground">
      {connected ? <span className="glow-dot" /> : <span className="size-1.5 rounded-full bg-muted-foreground/40" />}
      <span className="max-w-28 truncate">{label}</span>
    </span>
  );
}
