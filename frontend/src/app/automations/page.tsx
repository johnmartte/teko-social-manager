"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { api } from "@/lib/api";

type Rule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

type AutomationsResponse = {
  rules: Rule[];
  impact: {
    operational_savings_hours: string;
    response_time_reduction_percent: number;
    crisis_risk_reduction_percent: number;
  };
};

export default function AutomationsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [impact, setImpact] = useState<AutomationsResponse["impact"] | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api<AutomationsResponse>("/workspace/automations");
      setRules(data.rules || []);
      setImpact(data.impact || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
    );

    try {
      await api(`/workspace/automations/${id}/toggle`, { method: "PATCH" });
      await loadData();
    } catch {
      await loadData();
    }
  }

  return (
    <div className="space-y-6 teko-enter">
      <section className="rounded-[30px] border border-border bg-card/95 px-6 py-6 shadow-[0_20px_48px_rgba(73,57,27,0.1)]">
        <h1 className="text-2xl font-bold">Automatizaciones</h1>
        <p className="text-sm text-muted mt-1">
          Activa reglas para escalar moderacion, rendimiento y operacion diaria.
        </p>
      </section>

      <Card title="Reglas activas">
        <div className="space-y-3">
          {loading ? <p className="text-sm text-muted text-center py-6">Cargando reglas...</p> : null}
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-border bg-background/80 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{rule.name}</p>
                <p className="text-xs text-muted mt-1 max-w-xl">{rule.description}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleRule(rule.id)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  rule.enabled ? "bg-success" : "bg-border"
                }`}
                aria-label={`toggle-${rule.id}`}
              >
                <span
                  className={`block h-6 w-6 bg-white rounded-full transition-transform ${
                    rule.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Impacto estimado">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard label="Ahorro operativo" value={`${impact?.operational_savings_hours || "0.0"} h/sem`} tone="success" />
          <MetricCard label="Tiempo de respuesta" value={`-${impact?.response_time_reduction_percent ?? 0}%`} tone="info" />
          <MetricCard label="Riesgo de crisis" value={`-${impact?.crisis_risk_reduction_percent ?? 0}%`} tone="warning" />
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "info" | "warning";
}) {
  const tones: Record<string, string> = {
    success: "bg-success-light text-green-800 border-green-200",
    info: "bg-fb-light text-fb border-blue-200",
    warning: "bg-warning-light text-amber-700 border-amber-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${tones[tone]}`}>
      <p className="text-xs">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
