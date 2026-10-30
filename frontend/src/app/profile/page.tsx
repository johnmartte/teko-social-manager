"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toaster";
import Card from "@/components/Card";
import SocialLogo from "@/components/SocialLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign, ScheduledPost } from "@/lib/types";

export default function ProfilePage() {
  const { user, status, updateProfile, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState<ScheduledPost[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    api<ScheduledPost[]>("/scheduled-posts").then(setPosts).catch(() => setPosts([]));
    api<Campaign[]>("/campaigns").then(setCampaigns).catch(() => setCampaigns([]));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(name.trim());
      toast("success", "Perfil actualizado");
    } catch (err) {
      toast("error", "No se pudo guardar tu nombre", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const count = (s: ScheduledPost["status"]) => (posts ? posts.filter((p) => p.status === s).length : "—");
  const initial = (user?.name || "U").charAt(0).toUpperCase();
  const unchanged = name.trim() === (user?.name ?? "") || name.trim().length < 2;

  return (
    <div className="teko-enter mx-auto max-w-4xl space-y-6">
      <h1 className="sr-only">Mi perfil</h1>

      <div className="teko-card flex flex-wrap items-center gap-4 p-5">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-peach to-rose text-2xl font-semibold text-ink ring-2 ring-border">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{user?.name || "Usuario"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Datos personales">
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Correo</Label>
              <Input id="profile-email" value={user?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">
                El correo y la contraseña se cambian en{" "}
                <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">
                  Configuración
                </Link>
                .
              </p>
            </div>
            <Button type="submit" disabled={saving || unchanged}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>
        </Card>

        <Card title="Cuentas conectadas">
          <ul className="space-y-3">
            <li className="flex items-center justify-between rounded-xl bg-background p-3">
              <span className="flex items-center gap-3 text-sm font-medium">
                <SocialLogo platform="instagram" size="sm" />
                Instagram
              </span>
              <span className="text-xs text-muted-foreground">{status?.instagram.connected ? "Conectada" : "Sin conectar"}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-background p-3">
              <span className="flex items-center gap-3 text-sm font-medium">
                <SocialLogo platform="facebook" size="sm" />
                {status?.facebook.pageName || "Facebook"}
              </span>
              <span className="text-xs text-muted-foreground">{status?.facebook.connected ? "Conectada" : "Sin conectar"}</span>
            </li>
          </ul>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/settings">
              <Settings className="size-4" />
              Administrar conexiones
            </Link>
          </Button>
        </Card>
      </div>

      <Card title="Tu actividad">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Borradores", count("draft")],
            ["Programados", count("pending")],
            ["Publicados", count("published")],
            ["Campañas", campaigns ? campaigns.length : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-background p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
