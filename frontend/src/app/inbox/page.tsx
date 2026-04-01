"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { api } from "@/lib/api";

type InboxItem = {
  id: string;
  channel: "Instagram" | "Facebook";
  from: string;
  message: string;
  level: "Alta" | "Media" | "Baja";
  age: string;
};

type InboxResponse = {
  conversations: InboxItem[];
  templates: string[];
};

export default function InboxPage() {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState("");

  async function loadInbox() {
    setLoading(true);
    try {
      const data = await api<InboxResponse>("/workspace/inbox");
      setInboxItems(data.conversations || []);
      setTemplates(data.templates || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInbox();
  }, []);

  async function addTemplate() {
    const content = newTemplate.trim();
    if (content.length < 4) return;

    await api("/workspace/inbox/templates", {
      method: "POST",
      body: { content },
    });

    setNewTemplate("");
    await loadInbox();
  }

  return (
    <div className="space-y-6 teko-enter">
      <section className="rounded-[30px] border border-border bg-card/95 px-6 py-6 shadow-[0_20px_48px_rgba(73,57,27,0.1)]">
        <h1 className="text-2xl font-bold">Inbox unificado</h1>
        <p className="text-sm text-muted mt-1">
          Prioriza conversaciones, usa respuestas rapidas y baja tiempos de atencion.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Conversaciones" className="xl:col-span-2">
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted text-center py-8">Cargando conversaciones...</p>
            ) : inboxItems.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No hay conversaciones por ahora.</p>
            ) : inboxItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {item.from} <span className="text-xs text-muted font-normal">• {item.channel}</span>
                  </p>
                  <span
                    className="text-[11px] px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        item.level === "Alta"
                          ? "#fee2e2"
                          : item.level === "Media"
                          ? "#fef3c7"
                          : "#dcfce7",
                      color:
                        item.level === "Alta"
                          ? "#b91c1c"
                          : item.level === "Media"
                          ? "#92400e"
                          : "#166534",
                    }}
                  >
                    {item.level}
                  </span>
                </div>
                <p className="text-sm mt-2">{item.message}</p>
                <p className="text-xs text-muted mt-1">{item.age}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Respuestas rapidas">
          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-xs text-muted">Sin plantillas activas.</p>
            ) : templates.map((template) => (
              <button
                key={template}
                className="w-full rounded-xl border border-border bg-background/80 text-left px-3 py-2.5 text-xs hover:bg-card transition-colors"
              >
                {template}
              </button>
            ))}
          </div>

          <input
            value={newTemplate}
            onChange={(e) => setNewTemplate(e.target.value)}
            placeholder="Nueva plantilla..."
            className="mt-4 w-full rounded-xl border border-border bg-background/80 text-sm px-3 py-2.5 outline-none"
          />

          <button
            onClick={addTemplate}
            className="mt-3 w-full rounded-xl bg-accent text-white text-sm font-medium py-2.5 hover:opacity-90 transition-opacity"
          >
            Crear nueva plantilla
          </button>
        </Card>
      </div>
    </div>
  );
}
