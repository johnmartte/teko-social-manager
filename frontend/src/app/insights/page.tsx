"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { api, formatNum } from "@/lib/api";
import type { InsightMetric, WorkspaceSocialMeta } from "@/lib/types";

export default function InsightsPage() {
  const { status } = useAuth();
  const [igInsights, setIgInsights] = useState<InsightMetric[]>([]);
  const [fbInsights, setFbInsights] = useState<InsightMetric[]>([]);
  const [period, setPeriod] = useState("day");
  const [meta, setMeta] = useState<WorkspaceSocialMeta["insights"] | null>(null);

  useEffect(() => {
    api<WorkspaceSocialMeta>("/workspace/social/meta")
      .then((r) => setMeta(r.insights))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status?.instagram.connected) {
      api<{ data: InsightMetric[] }>(`/instagram/insights?period=${period}`)
        .then((r) => setIgInsights(r.data || []))
        .catch(() => {});
    }
    if (status?.facebook.connected) {
      api<{ data: InsightMetric[] }>(`/facebook/page/insights?period=${period}`)
        .then((r) => setFbInsights(r.data || []))
        .catch(() => {});
    }
  }, [status, period]);

  const periods = meta?.periods ?? [
    { value: "day", label: "Hoy" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
  ];
  const igLabels = meta?.instagram_labels ?? {};
  const fbLabels = meta?.facebook_labels ?? {};
  const noDataText = meta?.messages.no_data ?? "Sin datos disponibles.";
  const connectText = meta?.messages.connect_account ?? "Conecta una cuenta para ver estadisticas.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Estadísticas</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none"
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {status?.instagram.connected && (
        <Card title="Instagram" color="#e1306c">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {igInsights.map((m) => {
              const val = m.values?.[m.values.length - 1]?.value;
              return (
                <div key={m.name} className="bg-background rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{formatNum(val)}</p>
                  <p className="text-xs text-muted mt-1">{igLabels[m.name] || m.name}</p>
                </div>
              );
            })}
            {igInsights.length === 0 && (
              <p className="col-span-4 text-sm text-muted text-center py-4">{noDataText}</p>
            )}
          </div>
        </Card>
      )}

      {status?.facebook.connected && (
        <Card title="Facebook" color="#1877f2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {fbInsights.map((m) => {
              const val = m.values?.[m.values.length - 1]?.value;
              return (
                <div key={m.name} className="bg-background rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{formatNum(val)}</p>
                  <p className="text-xs text-muted mt-1">{fbLabels[m.name] || m.name}</p>
                </div>
              );
            })}
            {fbInsights.length === 0 && (
              <p className="col-span-5 text-sm text-muted text-center py-4">{noDataText}</p>
            )}
          </div>
        </Card>
      )}

      {!status?.instagram.connected && !status?.facebook.connected && (
        <p className="text-muted text-center py-12">{connectText}</p>
      )}
    </div>
  );
}
