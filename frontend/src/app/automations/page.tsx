"use client";

import { useState } from "react";
import Card from "@/components/Card";

type Rule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

const initialRules: Rule[] = [
  {
    id: "r1",
    name: "Publicacion inteligente",
    description: "Sugiere hora de posteo segun rendimiento de las ultimas 4 semanas.",
    enabled: true,
  },
  {
    id: "r2",
    name: "Moderacion automatica",
    description: "Marca comentarios con spam o lenguaje toxico para revision rapida.",
    enabled: true,
  },
  {
    id: "r3",
    name: "Escalamiento de soporte",
    description: "Cuando un mensaje incluye palabras clave, lo envia a prioridad alta.",
    enabled: false,
  },
  {
    id: "r4",
    name: "Resumen ejecutivo diario",
    description: "Genera un resumen de KPIs y actividad de comunidad al final del dia.",
    enabled: true,
  },
];

export default function AutomationsPage() {
  const [rules, setRules] = useState(initialRules);

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    );
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
          <MetricCard label="Ahorro operativo" value="6.5 h/sem" tone="success" />
          <MetricCard label="Tiempo de respuesta" value="-22%" tone="info" />
          <MetricCard label="Riesgo de crisis" value="-31%" tone="warning" />
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
