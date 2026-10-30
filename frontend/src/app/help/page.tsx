"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { faqs, guides } from "@/lib/helpContent";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function HelpPage() {
  const [tab, setTab] = useState<"manual" | "faq">("manual");
  const [query, setQuery] = useState("");
  const q = norm(query.trim());

  const shownGuides = useMemo(
    () => guides.filter((g) => !q || norm([g.title, g.summary, ...g.steps.map((s) => s.text), ...(g.tips ?? [])].join(" ")).includes(q)),
    [q]
  );
  const shownFaqs = useMemo(() => faqs.filter((f) => !q || norm(f.q + " " + f.a).includes(q)), [q]);

  return (
    <div className="teko-enter mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="pill-track" role="tablist" aria-label="Sección de ayuda">
          <button role="tab" data-active={tab === "manual"} aria-selected={tab === "manual"} onClick={() => setTab("manual")}>
            Manual de uso
          </button>
          <button role="tab" data-active={tab === "faq"} aria-selected={tab === "faq"} onClick={() => setTab("faq")}>
            Preguntas frecuentes
          </button>
        </div>
        <label className="flex h-10 w-full items-center gap-2 rounded-full border border-input bg-card px-4 focus-within:border-ring sm:w-72">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la ayuda…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {tab === "manual" ? (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Índice del manual" className="hidden lg:block">
            <ul className="sticky top-24 space-y-0.5 text-sm">
              {shownGuides.map((g) => (
                <li key={g.id}>
                  <a href={`#${g.id}`} className="block rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-5">
            <div className="teko-card p-5">
              <h1 className="text-lg font-semibold">Bienvenido al manual de Teko Social</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Aquí aprendes a usar el sistema paso a paso, sin conocimientos previos. Elige un tema del índice o usa el buscador.
              </p>
            </div>

            {shownGuides.length === 0 && <p className="text-sm text-muted-foreground">No encontramos nada con esa búsqueda.</p>}

            {shownGuides.map((g) => (
              <section key={g.id} id={g.id} className="teko-card scroll-mt-24 space-y-4 p-5">
                <div>
                  <h2 className="text-base font-semibold">{g.title}</h2>
                  <p className="text-sm text-muted-foreground">{g.summary}</p>
                </div>
                <ol className="space-y-3">
                  {g.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 space-y-2">
                        <p className="text-sm leading-relaxed">{step.text}</p>
                        {step.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={step.image} alt="" className="max-w-full rounded-xl border border-border" />
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                {g.tips && (
                  <div className="space-y-1.5 rounded-xl border border-border bg-muted/50 p-3">
                    {g.tips.map((tip) => (
                      <p key={tip} className="text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">Consejo: </span>
                        {tip}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-3">
          <h1 className="sr-only">Preguntas frecuentes</h1>
          {shownFaqs.length === 0 && <p className="text-sm text-muted-foreground">No encontramos nada con esa búsqueda.</p>}
          {shownFaqs.map((f) => (
            <details key={f.q} className="teko-card group p-4">
              <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
