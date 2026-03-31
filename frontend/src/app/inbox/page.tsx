"use client";

import Card from "@/components/Card";

type InboxItem = {
  id: string;
  channel: "Instagram" | "Facebook";
  from: string;
  message: string;
  level: "Alta" | "Media" | "Baja";
  age: string;
};

const inboxItems: InboxItem[] = [
  {
    id: "m1",
    channel: "Instagram",
    from: "@sara.m",
    message: "Hola, tienen stock del modelo rojo?",
    level: "Alta",
    age: "hace 3 min",
  },
  {
    id: "m2",
    channel: "Facebook",
    from: "Camilo Reyes",
    message: "No puedo completar el checkout, me ayudan?",
    level: "Alta",
    age: "hace 8 min",
  },
  {
    id: "m3",
    channel: "Instagram",
    from: "@maria.pr",
    message: "Me encanto su ultima publicacion!",
    level: "Baja",
    age: "hace 25 min",
  },
  {
    id: "m4",
    channel: "Facebook",
    from: "Helena Vargas",
    message: "Podrian compartir tabla de tallas?",
    level: "Media",
    age: "hace 41 min",
  },
];

const templates = [
  "Gracias por escribirnos, te ayudamos en un momento.",
  "Aqui tienes el enlace directo con toda la informacion.",
  "Perfecto, ya escalamos tu caso al equipo de soporte.",
  "Tenemos stock disponible, te comparto opciones ahora mismo.",
];

export default function InboxPage() {
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
            {inboxItems.map((item) => (
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
            {templates.map((template) => (
              <button
                key={template}
                className="w-full rounded-xl border border-border bg-background/80 text-left px-3 py-2.5 text-xs hover:bg-card transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
          <button className="mt-4 w-full rounded-xl bg-accent text-white text-sm font-medium py-2.5 hover:opacity-90 transition-opacity">
            Crear nueva plantilla
          </button>
        </Card>
      </div>
    </div>
  );
}
