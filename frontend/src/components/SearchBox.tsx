"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, Layers, LayoutGrid, Search } from "lucide-react";
import { api } from "@/lib/api";
import { guides } from "@/lib/helpContent";
import { navGroups } from "@/components/Sidebar";
import type { Campaign, ScheduledPost } from "@/lib/types";

type Result = { key: string; kind: "Página" | "Campaña" | "Post" | "Ayuda"; label: string; hint?: string; href: string };

const STATUS: Record<ScheduledPost["status"], string> = { draft: "Borrador", pending: "Programado", published: "Publicado", failed: "Fallido" };
const ICON = { Página: LayoutGrid, Campaña: Layers, Post: FileText, Ayuda: BookOpen } as const;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PAGES: Result[] = [
  ...navGroups.flatMap((g) => g.items.map((i) => ({ key: `p-${i.href}`, kind: "Página" as const, label: i.label, hint: g.label, href: i.href }))),
  { key: "p-/profile", kind: "Página", label: "Mi perfil", hint: "Cuenta", href: "/profile" },
  { key: "p-/settings", kind: "Página", label: "Configuración", hint: "Cuenta", href: "/settings" },
];

/** Buscador del encabezado: páginas, campañas, posts y temas de ayuda. */
export default function SearchBox() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Los datos se piden una sola vez, la primera vez que se usa el buscador.
  function load() {
    if (loaded) return;
    setLoaded(true);
    api<ScheduledPost[]>("/scheduled-posts").then(setPosts).catch(() => {});
    api<Campaign[]>("/campaigns").then(setCampaigns).catch(() => {});
  }

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = norm(query.trim());
    if (!q) return PAGES.slice(0, 6);
    const terms = q.split(/\s+/);
    const match = (text: string) => terms.every((t) => norm(text).includes(t));

    const campaignName = new Map(campaigns.map((c) => [c.id, c.name]));
    const all: Result[] = [
      ...PAGES,
      ...campaigns.map((c) => ({ key: `c-${c.id}`, kind: "Campaña" as const, label: c.name, hint: c.description ?? undefined, href: `/feed?campaign=${c.id}` })),
      ...posts.map((p) => ({
        key: `post-${p.id}`,
        kind: "Post" as const,
        label: p.caption?.trim().slice(0, 70) || "Post sin texto",
        hint: [STATUS[p.status], p.campaign_id ? campaignName.get(p.campaign_id) : null].filter(Boolean).join(" · "),
        href: p.status === "published" ? "/posts" : `/feed?post=${p.id}`,
      })),
      ...guides.map((g) => ({ key: `h-${g.id}`, kind: "Ayuda" as const, label: g.title, hint: g.summary, href: `/help#${g.id}` })),
    ];
    return all.filter((r) => match(`${r.label} ${r.hint ?? ""}`)).slice(0, 8);
  }, [query, posts, campaigns]);

  function go(r: Result) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapRef} className="relative hidden lg:block">
      <label className="flex h-10 w-56 items-center gap-2 rounded-full border border-input bg-card px-4 focus-within:border-ring xl:w-72">
        <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            load();
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Buscar… (Ctrl K)"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      {open && (
        <ul id="search-results" role="listbox" className="absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">Sin resultados para «{query}».</li>
          ) : (
            results.map((r, i) => {
              const Icon = ICON[r.kind];
              return (
                <li key={r.key} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${i === active ? "bg-muted" : ""}`}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{r.label}</span>
                      {r.hint && <span className="block truncate text-xs text-muted-foreground">{r.hint}</span>}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{r.kind}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
