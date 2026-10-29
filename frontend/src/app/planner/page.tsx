"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { api } from "@/lib/api";
import { ScheduledPost } from "@/lib/types";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";

type PlannerMeta = {
  platforms: Record<string, { label: string; color: string }>;
  statuses: Record<string, { label: string; color: string }>;
};

type DetailModal = {
  post: ScheduledPost;
};

type CalendarView = "month" | "week" | "list";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return new Date(month.getFullYear(), month.getMonth(), day);
  }).map((date, index) => ({ date, index, inMonth: date.getMonth() === month.getMonth() }));
}

function weekDays(date: Date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function movePostToDate(post: ScheduledPost, targetDate: Date) {
  const original = new Date(post.scheduled_at!);
  const next = new Date(targetDate);
  next.setHours(original.getHours(), original.getMinutes(), 0, 0);
  return next.toISOString();
}

export default function PlannerPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<DetailModal | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const [rescheduling, setRescheduling] = useState<number | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [meta, setMeta] = useState<PlannerMeta>({
    platforms: {
      instagram: { label: "Instagram", color: "var(--ig)" },
      facebook: { label: "Facebook", color: "var(--fb)" },
      both: { label: "Ambas", color: "var(--info)" },
    },
    statuses: {
      pending: { label: "Pendiente", color: "var(--warning)" },
      published: { label: "Publicado", color: "var(--success)" },
      failed: { label: "Fallido", color: "var(--error)" },
    },
  });

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await api<ScheduledPost[]>("/scheduled-posts");
      setPosts(data.filter((p) => p.status !== "draft" && p.scheduled_at)); // los borradores viven en /feed
    } catch {
      setError("Error cargando posts programados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
    api<PlannerMeta>("/workspace/planner/meta")
      .then(setMeta)
      .catch(() => {});
  }, []);

  async function handlePublishNow(post: ScheduledPost) {
    setPublishing(post.id);
    try {
      await api(`/scheduled-posts/${post.id}/publish`, { method: "POST" });
      setModal(null);
      await loadPosts();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al publicar");
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete(post: ScheduledPost) {
    if (!confirm("¿Eliminar este post programado?")) return;
    setDeleting(post.id);
    try {
      await api(`/scheduled-posts/${post.id}`, { method: "DELETE" });
      setModal(null);
      await loadPosts();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  }

  async function handleDuplicate(post: ScheduledPost) {
    setDuplicating(post.id);
    try {
      const copy = await api<ScheduledPost>(`/scheduled-posts/${post.id}/duplicate`, { method: "POST" });
      setModal(null);
      setPosts((current) => [...current, copy]);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al duplicar");
    } finally {
      setDuplicating(null);
    }
  }

  async function handleReschedule(post: ScheduledPost, targetDate: Date) {
    if (post.status === "published") return;
    const nextScheduledAt = movePostToDate(post, targetDate);
    setRescheduling(post.id);
    try {
      const updated = await api<ScheduledPost>(`/scheduled-posts/${post.id}`, {
        method: "PATCH",
        body: { scheduled_at: nextScheduledAt },
      });
      setPosts((current) => current.map((item) => (item.id === post.id ? updated : item)));
      setSelectedDate(dateKey(targetDate));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "No se pudo mover la publicación");
    } finally {
      setRescheduling(null);
      setDropDate(null);
    }
  }

  function toggleSelect(postId: number) {
    setSelectedIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  }

  function PostRow({
    post,
    selected,
    meta,
    onSelect,
    onOpen,
  }: {
    post: ScheduledPost;
    selected: boolean;
    meta: PlannerMeta;
    onSelect: (id: number) => void;
    onOpen: () => void;
  }) {
    return (
      <button
        onClick={onOpen}
        className="teko-card flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-card-hover"
      >
        <input
          type="checkbox"
          checked={selected}
          disabled={post.status === "published"}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onSelect(post.id)}
          className="h-4 w-4 shrink-0"
        />
        <div className="w-14 shrink-0 text-center">
          <p className="text-sm font-semibold">
            {new Date(post.scheduled_at!).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {post.media_urls?.[0] ? (
          <img src={post.media_urls[0]} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <ImageOff className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{post.caption || "(Sin caption)"}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `${meta.platforms[post.platform]?.color || "var(--muted-foreground)"}20`,
                color: meta.platforms[post.platform]?.color || "var(--muted-foreground)",
              }}
            >
              {meta.platforms[post.platform]?.label || post.platform}
            </span>
            <span className="text-[11px] capitalize text-muted-foreground">{post.type}</span>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: `${meta.statuses[post.status]?.color || "var(--muted-foreground)"}20`,
            color: meta.statuses[post.status]?.color || "var(--muted-foreground)",
          }}
        >
          {meta.statuses[post.status]?.label || post.status}
        </span>
      </button>
    );
  }

  function selectAllPending() {
    const pendingIds = posts.filter((p) => p.status !== "published").map((p) => p.id);
    setSelectedIds(pendingIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    if (!confirm(`¿Eliminar ${selectedIds.length} post(s) seleccionados?`)) return;

    setDeletingBulk(true);
    let deleted = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        await api(`/scheduled-posts/${id}`, { method: "DELETE" });
        deleted++;
      } catch {
        failed++;
      }
    }

    setDeletingBulk(false);
    setSelectedIds([]);
    await loadPosts();

    if (failed > 0) {
      alert(`${deleted} eliminados, ${failed} no se pudieron eliminar.`);
      return;
    }

    alert(`${deleted} post(s) eliminados correctamente.`);
  }

  const postsByDate = posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const key = dateKey(new Date(post.scheduled_at!));
    (acc[key] ??= []).push(post);
    return acc;
  }, {});
  const days = monthDays(currentMonth);
  const currentWeek = weekDays(selectedDate ? new Date(`${selectedDate}T12:00:00`) : new Date());
  const visiblePosts = selectedDate ? postsByDate[selectedDate] ?? [] : posts;

  const pending = posts.filter((p) => p.status === "pending");
  const published = posts.filter((p) => p.status === "published");
  const failed = posts.filter((p) => p.status === "failed");

  return (
    <div className="space-y-6 teko-enter">
      <h1 className="sr-only">Calendario</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendientes", count: pending.length, tone: "bg-butter" },
          { label: "Publicados", count: published.length, tone: "bg-mint" },
          { label: "Fallidos", count: failed.length, tone: "bg-rose" },
        ].map(({ label, count, tone }) => (
          <div key={label} className={`rounded-[18px] p-4 text-ink ${tone}`}>
            <p className="text-[28px] font-semibold leading-none tabular-nums">{count}</p>
            <p className="text-xs mt-2 opacity-70">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {loading ? (
        <Card><p className="text-muted-foreground text-sm text-center py-12">Cargando...</p></Card>
      ) : error ? (
        <Card><p className="text-error text-sm text-center py-12">{error}</p></Card>
      ) : (
        <div className="space-y-6">
          <div className="teko-card flex items-center justify-between gap-3 flex-wrap px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {posts.length === 0
                ? "No hay publicaciones programadas todavía."
                : selectedIds.length > 0
                ? `${selectedIds.length} seleccionado(s)`
                : "Selecciona posts para eliminar varios a la vez"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllPending} disabled={posts.length === 0}>
                Seleccionar pendientes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={selectedIds.length === 0}
                onClick={clearSelection}
              >
                Limpiar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-error hover:text-error hover:bg-error-light"
                disabled={selectedIds.length === 0 || deletingBulk}
                onClick={handleBulkDelete}
              >
                {deletingBulk ? "Eliminando..." : "Eliminar seleccionados"}
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-semibold capitalize">
                  {currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedDate ? `${visiblePosts.length} publicación(es) ese día` : "Selecciona un día para ver sus publicaciones"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="pill-track mr-2" role="tablist" aria-label="Vista del calendario">
                  {(["month", "week", "list"] as CalendarView[]).map((view) => (
                    <button key={view} role="tab" aria-selected={calendarView === view} data-active={calendarView === view} onClick={() => setCalendarView(view)}>
                      {view === "month" ? "Mes" : view === "week" ? "Semana" : "Lista"}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(dateKey(new Date())); }}>
                  Hoy
                </Button>
                <Button variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            {calendarView === "month" && <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map((day) => (
                <span key={day} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{day}</span>
              ))}
            </div>}
            {calendarView === "month" && <div className="grid grid-cols-7">
              {days.map(({ date, index, inMonth }) => {
                const key = dateKey(date);
                const dayPosts = postsByDate[key] ?? [];
                const isToday = key === dateKey(new Date());
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`min-h-[82px] border-b border-r border-border p-2 text-left transition-colors hover:bg-card-hover ${!inMonth ? "bg-muted/20 text-muted-foreground/50" : ""} ${isSelected ? "bg-accent ring-2 ring-inset ring-primary" : ""}`}
                  >
                    <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-primary font-semibold text-primary-foreground" : ""}`}>{date.getDate()}</span>
                    <span className="mt-1 flex flex-col gap-1">
                      {dayPosts.slice(0, 3).map((post) => (
                        <span key={post.id} className="truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-foreground">
                          {new Date(post.scheduled_at!).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} {post.caption || "Sin caption"}
                        </span>
                      ))}
                      {dayPosts.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} más</span>}
                    </span>
                  </button>
                );
              })}
            </div>}
            {calendarView === "week" && <div className="grid grid-cols-7 divide-x divide-border">
              {currentWeek.map((date) => {
                const key = dateKey(date);
                const dayPosts = postsByDate[key] ?? [];
                return (
                  <div
                    key={key}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropDate(key);
                    }}
                    onDragLeave={() => setDropDate((current) => current === key ? null : current)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const postId = Number(event.dataTransfer.getData("text/plain"));
                      const post = posts.find((item) => item.id === postId);
                      if (post) void handleReschedule(post, date);
                    }}
                    className={`min-h-[260px] p-2 transition-colors ${dropDate === key ? "bg-primary/10" : ""}`}
                  >
                    <button type="button" onClick={() => setSelectedDate(key)} className={`mb-3 w-full rounded-lg px-1 py-2 text-center ${key === dateKey(new Date()) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      <span className="block text-[10px] uppercase opacity-70">{date.toLocaleDateString("es-ES", { weekday: "short" })}</span>
                      <span className="text-sm font-semibold">{date.getDate()}</span>
                    </button>
                    <div className="space-y-2">
                      {dayPosts.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          draggable={post.status !== "published" && rescheduling !== post.id}
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", String(post.id));
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={() => setModal({ post })}
                          className={`w-full rounded-xl border border-border bg-muted/40 p-2 text-left hover:bg-card-hover ${rescheduling === post.id ? "opacity-50" : ""}`}
                        >
                          <span className="text-[10px] font-semibold">{new Date(post.scheduled_at!).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="mt-1 block line-clamp-2 text-[11px]">{post.caption || "Sin caption"}</span>
                        </button>
                      ))}
                      {dayPosts.length === 0 && <p className="pt-4 text-center text-[10px] text-muted-foreground">Sin posts</p>}
                    </div>
                  </div>
                );
              })}
            </div>}
          </Card>

          {calendarView === "list" && visiblePosts.length > 0 ? (
            <div>
              <h2 className="mb-3 text-xs font-semibold capitalize tracking-wider text-muted-foreground">
                {selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : "Próximas publicaciones"}
              </h2>
              <div className="space-y-3">
                {visiblePosts.map((post) => (
                  <PostRow key={post.id} post={post} selected={selectedIds.includes(post.id)} meta={meta} onSelect={toggleSelect} onOpen={() => setModal({ post })} />
                ))}
              </div>
            </div>
          ) : (
            <Card><p className="py-8 text-center text-sm text-muted-foreground">{posts.length === 0 ? "Ve a Feed para crear un borrador o a Publicar para programar contenido." : "No hay publicaciones para este día."}</p></Card>
          )}
        </div>
      )}

      {/* Detail modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Post #{modal.post.id}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(modal.post.scheduled_at!).toLocaleString("es-ES")}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>

            {modal.post.media_urls?.[0] && (
              <img src={modal.post.media_urls[0]} alt="" className="w-full rounded-lg object-cover max-h-48" />
            )}

            {modal.post.caption && (
              <p className="text-sm">{modal.post.caption}</p>
            )}

            <div className="flex gap-2">
              <span
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${meta.platforms[modal.post.platform]?.color || "var(--muted-foreground)"}20`,
                  color: meta.platforms[modal.post.platform]?.color || "var(--muted-foreground)",
                }}
              >
                {meta.platforms[modal.post.platform]?.label || modal.post.platform}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-background border border-border capitalize">
                {modal.post.type}
              </span>
              <span
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${meta.statuses[modal.post.status]?.color || "var(--muted-foreground)"}20`,
                  color: meta.statuses[modal.post.status]?.color || "var(--muted-foreground)",
                }}
              >
                {meta.statuses[modal.post.status]?.label || modal.post.status}
              </span>
            </div>

            {modal.post.error_message && (
              <p className="text-xs text-error bg-error-light border border-error-border rounded-xl px-3 py-2">
                {modal.post.error_message}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={duplicating === modal.post.id}
                onClick={() => handleDuplicate(modal.post)}
              >
                {duplicating === modal.post.id ? "Duplicando..." : "Duplicar como borrador"}
              </Button>
              {modal.post.status !== "published" && (
                <>
                  <Button
                    className="flex-1"
                    disabled={publishing === modal.post.id}
                    onClick={() => handlePublishNow(modal.post)}
                  >
                    {publishing === modal.post.id ? "Publicando..." : "Publicar ahora"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-error hover:text-error hover:bg-error-light"
                    disabled={deleting === modal.post.id}
                    onClick={() => handleDelete(modal.post)}
                  >
                    {deleting === modal.post.id ? "..." : "Eliminar"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
