"use client";

import Card from "@/components/Card";

const queueColumns = [
  {
    title: "Ideas",
    count: 6,
    color: "#e8a126",
    cards: [
      "Serie de tips de temporada",
      "Caso de cliente con resultados",
      "Behind the scenes del equipo",
    ],
  },
  {
    title: "Produccion",
    count: 4,
    color: "#e1306c",
    cards: [
      "Guion Reel de producto",
      "Carrusel educativo de 5 slides",
      "Plantillas para stories",
    ],
  },
  {
    title: "Revision",
    count: 2,
    color: "#1877f2",
    cards: ["Reel FAQ legal", "Post de lanzamiento semanal"],
  },
  {
    title: "Programado",
    count: 11,
    color: "#22c55e",
    cards: ["Promo viernes", "Resumen mensual", "Historia interactiva"],
  },
];

const weekPlan = [
  { day: "Lun", time: "09:00", item: "Post producto", platform: "Instagram" },
  { day: "Mar", time: "12:30", item: "FAQ cliente", platform: "Facebook" },
  { day: "Mie", time: "18:00", item: "Reel tutorial", platform: "Instagram" },
  { day: "Jue", time: "10:15", item: "Live anuncio", platform: "Instagram" },
  { day: "Vie", time: "17:00", item: "Oferta semanal", platform: "Facebook" },
];

export default function PlannerPage() {
  return (
    <div className="space-y-6 teko-enter">
      <section className="rounded-[30px] border border-border bg-card/95 px-6 py-6 shadow-[0_20px_48px_rgba(73,57,27,0.1)]">
        <h1 className="text-2xl font-bold">Planner editorial</h1>
        <p className="text-sm text-muted mt-1">
          Organiza tu pipeline de contenido y define publicaciones por semana.
        </p>
      </section>

      <Card title="Flujo de contenido">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {queueColumns.map((column) => (
            <div key={column.title} className="rounded-2xl border border-border bg-background/80 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">{column.title}</p>
                <span className="text-[11px] rounded-full px-2 py-1" style={{ backgroundColor: `${column.color}20`, color: column.color }}>
                  {column.count}
                </span>
              </div>
              <div className="space-y-2">
                {column.cards.map((card) => (
                  <div key={card} className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs">
                    {card}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Calendario semanal">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {weekPlan.map((slot) => (
            <div key={`${slot.day}-${slot.time}`} className="rounded-2xl border border-border bg-background/80 px-3 py-4">
              <p className="text-xs text-muted">{slot.day}</p>
              <p className="text-lg font-bold mt-0.5">{slot.time}</p>
              <p className="text-sm mt-2">{slot.item}</p>
              <p className="text-xs text-muted mt-1">{slot.platform}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
