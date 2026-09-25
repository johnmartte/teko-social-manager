"use client";

import { useAuth } from "@/context/AuthContext";
import { getLoginUrl } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Search, Sun, Moon, User, Settings, LogOut, Link2 } from "lucide-react";
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

  return (
    <header className="h-16 flex items-center justify-between gap-4 px-4 sm:px-6 sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      {/* Búsqueda */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="flex items-center gap-2 h-9 w-full rounded-md border border-input bg-card px-3">
          <Search className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Estado de conexión */}
        <div className="hidden md:flex items-center gap-1.5">
          <ConnectionPill label="Instagram" connected={!!igConnected} />
          <ConnectionPill
            label={fbConnected ? status?.facebook.pageName || "Facebook" : "Facebook"}
            connected={!!fbConnected}
          />
        </div>

        {!anyConnected && (
          <Button asChild size="sm" className="h-9">
            <a href={getLoginUrl()}>
              <Link2 className="size-4" strokeWidth={1.75} />
              Conectar cuentas
            </a>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? (
            <Sun className="size-4" strokeWidth={1.75} />
          ) : (
            <Moon className="size-4" strokeWidth={1.75} />
          )}
        </Button>

        {/* Menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="size-9 rounded-full bg-muted border border-border flex items-center justify-center text-[13px] font-medium hover:bg-accent transition-colors"
              aria-label="Menú de usuario"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
    <span className="inline-flex items-center gap-1.5 h-7 rounded-full border border-border bg-card px-2.5 text-xs text-muted-foreground">
      <span
        className={`size-1.5 rounded-full ${connected ? "bg-success" : "bg-muted-foreground/40"}`}
      />
      <span className="max-w-28 truncate">{label}</span>
    </span>
  );
}
