"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Fingerprint, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { isCancelled, passkeysSupported, registerPasskey, type Passkey } from "@/lib/passkeys";
import { useToast } from "@/components/Toaster";
import { Button } from "@/components/ui/button";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) : "nunca");

/** Acceso rápido: activa Touch ID / llavero para entrar sin escribir correo y contraseña. */
export default function PasskeysCard() {
  const toast = useToast();
  const supported = useSyncExternalStore(() => () => {}, passkeysSupported, () => false);
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ passkeys: Passkey[] }>("/auth/passkeys").then((r) => setPasskeys(r.passkeys)).catch(() => setPasskeys([]));
  }, []);

  async function activate() {
    setBusy(true);
    try {
      const p = await registerPasskey(navigator.platform.includes("Mac") ? "MacBook (Touch ID)" : "Este dispositivo");
      setPasskeys((cur) => [p, ...(cur ?? [])]);
      toast("success", "Acceso rápido activado", "La próxima vez podrás entrar con tu huella desde la pantalla de inicio de sesión.");
    } catch (e) {
      if (!isCancelled(e)) toast("error", "No se pudo activar", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Passkey) {
    try {
      await api(`/auth/passkeys/${p.id}`, { method: "DELETE" });
      setPasskeys((cur) => (cur ?? []).filter((x) => x.id !== p.id));
      toast("success", "Acceso rápido eliminado", p.name);
    } catch (e) {
      toast("error", "No se pudo eliminar", e instanceof Error ? e.message : undefined);
    }
  }

  if (!supported) {
    return <p className="text-sm text-muted-foreground">Este navegador no permite passkeys. Prueba con Safari, Chrome o Edge actualizados.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Entra con la huella de tu Mac (Touch ID) o con tu gestor de contraseñas, sin escribir correo ni contraseña.
      </p>

      {passkeys && passkeys.length > 0 && (
        <ul className="space-y-2">
          {passkeys.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl bg-background p-3">
              <Fingerprint className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">Último uso: {when(p.last_used_at)}</p>
              </div>
              <button onClick={() => remove(p)} aria-label={`Eliminar ${p.name}`} className="p-1.5 text-muted-foreground hover:text-error">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={activate} disabled={busy}>
        <Fingerprint className="size-4" />
        {busy ? "Esperando tu huella…" : passkeys?.length ? "Añadir otro dispositivo" : "Activar Touch ID en este dispositivo"}
      </Button>
    </div>
  );
}
