"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Usage = {
  configured: boolean;
  plan?: string;
  credits_used?: number;
  credits_limit?: number;
  used_percent?: number | null;
  storage_bytes?: number;
};

/** Barra de uso de Cloudinary: ámbar al 80 %, roja al 95 %. */
export default function StorageUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<Usage>("/storage/usage").then(setUsage).catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="text-xs text-muted-foreground">No se pudo consultar el almacenamiento.</p>;
  if (!usage) return <div className="h-10 animate-pulse rounded-lg bg-muted" />;
  if (!usage.configured) {
    return (
      <p className="text-xs text-muted-foreground">
        Añade CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Railway para ver el espacio disponible.
      </p>
    );
  }

  const pct = Math.min(100, usage.used_percent ?? 0);
  const color = pct >= 95 ? "#f0716a" : pct >= 80 ? "#e6a93a" : "#6fcf97";
  const gb = usage.storage_bytes != null ? (usage.storage_bytes / 1024 ** 3).toFixed(2) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">
          Cloudinary{usage.plan ? ` · plan ${usage.plan}` : ""}
        </span>
        <span className="font-medium">
          {usage.credits_used ?? "—"} de {usage.credits_limit ?? "—"} créditos ({pct.toFixed(1)} %)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {gb ? `${gb} GB almacenados. ` : ""}Los créditos se comparten entre almacenamiento, tráfico y transformaciones.
      </p>
    </div>
  );
}
