"use client";

import { useEffect, useState } from "react";
import { MessageSquareWarning, Inbox, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type Rule = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  keywords: string[];
};

// Cada regla se aplica en una pantalla concreta; se dice dónde para que no sean interruptores mudos.
const RULE_META: Record<string, { icon: typeof Inbox; tone: string; where: string; placeholder: string }> = {
  "comment-moderation": {
    icon: MessageSquareWarning,
    tone: "bg-butter",
    where: "Se aplica en Comentarios: los que coinciden aparecen marcados.",
    placeholder: "Añadir palabra o enlace",
  },
  "support-escalation": {
    icon: Inbox,
    tone: "bg-sky",
    where: "Se aplica en Inbox: los mensajes que coinciden suben a prioridad alta.",
    placeholder: "Añadir palabra",
  },
};

export default function AutomationsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ rules: Rule[] }>("/workspace/automations")
      .then((d) => setRules(d.rules))
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar las reglas"))
      .finally(() => setLoading(false));
  }, []);

  function replace(rule: Rule) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
  }

  async function toggle(rule: Rule) {
    replace({ ...rule, enabled: !rule.enabled });
    try {
      const { rule: saved } = await api<{ rule: Rule }>(`/workspace/automations/${rule.id}/toggle`, { method: "PATCH" });
      replace(saved);
    } catch (e) {
      replace(rule);
      setError(e instanceof Error ? e.message : "No se pudo cambiar la regla");
    }
  }

  async function saveKeywords(rule: Rule, keywords: string[]) {
    replace({ ...rule, keywords });
    try {
      const { rule: saved } = await api<{ rule: Rule }>(`/workspace/automations/${rule.id}/keywords`, {
        method: "PUT",
        body: { keywords },
      });
      replace(saved);
    } catch (e) {
      replace(rule);
      setError(e instanceof Error ? e.message : "No se pudieron guardar las palabras");
    }
  }

  return (
    <div className="space-y-5 teko-enter max-w-3xl">
      <h1 className="sr-only">Automatizaciones</h1>
      {error && (
        <p className="text-sm text-error border border-error-border bg-error-light rounded-xl px-4 py-2.5 flex justify-between gap-3">
          {error}
          <button onClick={() => setError(null)} aria-label="Cerrar aviso">
            <X className="size-4" />
          </button>
        </p>
      )}

      {loading && <div className="teko-card h-40 animate-pulse" />}

      {rules.map((rule) => {
        const meta = RULE_META[rule.key];
        const Icon = meta?.icon ?? Inbox;
        return (
          <section key={rule.id} className="teko-card p-5">
            <div className="flex items-start gap-4">
              <span className={cn("size-11 rounded-2xl flex items-center justify-center text-ink shrink-0", meta?.tone ?? "bg-lilac")}>
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold">{rule.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                {meta && <p className="text-xs text-muted-foreground/80 mt-1">{meta.where}</p>}
              </div>
              <Switch checked={rule.enabled} onCheckedChange={() => toggle(rule)} aria-label={`Activar ${rule.name}`} />
            </div>

            <div className={cn("mt-5 transition-opacity", !rule.enabled && "opacity-45")}>
              <KeywordEditor
                keywords={rule.keywords}
                placeholder={meta?.placeholder ?? "Añadir"}
                onChange={(k) => saveKeywords(rule, k)}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function KeywordEditor({
  keywords,
  placeholder,
  onChange,
}: {
  keywords: string[];
  placeholder: string;
  onChange: (k: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const word = draft.trim().toLowerCase();
    setDraft("");
    if (word.length >= 2 && !keywords.includes(word)) onChange([...keywords, word]);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/40 p-2.5">
      {keywords.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1.5 rounded-full bg-secondary text-sm">
          {k}
          <button
            onClick={() => onChange(keywords.filter((x) => x !== k))}
            aria-label={`Quitar ${k}`}
            className="size-5 rounded-full hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        maxLength={40}
        className="flex-1 min-w-32 h-8 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
