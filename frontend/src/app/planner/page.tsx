"use client";

import { useState, useEffect } from "react";
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

export default function PlannerPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<DetailModal | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
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
      setPosts(data);
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

  function toggleSelect(postId: number) {
    setSelectedIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
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

  // Group posts by date
  const grouped = posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const date = new Date(post.scheduled_at).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {});

  const pending = posts.filter((p) => p.status === "pending");
  const published = posts.filter((p) => p.status === "published");
  const failed = posts.filter((p) => p.status === "failed");

  return (
    <div className="space-y-6 teko-enter">
      <section className="rounded-xl border border-border bg-card/95 px-6 py-6 shadow-[0_20px_48px_var(--shadow-color)]">
        <h1 className="text-2xl font-semibold">Planner editorial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Posts programados y pendientes de publicación.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pendientes", count: pending.length, color: "var(--warning)" },
          { label: "Publicados", count: published.length, color: "var(--success)" },
          { label: "Fallidos", count: failed.length, color: "var(--error)" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card/95 px-5 py-4 text-center">
            <p className="text-2xl font-semibold" style={{ color }}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {loading ? (
        <Card><p className="text-muted-foreground text-sm text-center py-12">Cargando...</p></Card>
      ) : error ? (
        <Card><p className="text-error text-sm text-center py-12">{error}</p></Card>
      ) : posts.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No hay posts programados.</p>
            <p className="text-xs mt-1">Ve a Publicar → Programar para crear uno.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap bg-card/95 border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {selectedIds.length > 0
                ? `${selectedIds.length} seleccionado(s)`
                : "Selecciona posts para eliminar varios a la vez"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllPending}>
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

          {Object.entries(grouped).map(([date, dayPosts]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-muted-foreground capitalize tracking-wider mb-3">
                {date}
              </h2>
              <div className="space-y-3">
                {dayPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setModal({ post })}
                    className={`w-full flex items-center gap-4 bg-card/95 border rounded-lg px-5 py-4 text-left hover:border-foreground/10 transition-colors ${
                      selectedIds.includes(post.id) ? "border-border" : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(post.id)}
                      disabled={post.status === "published"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(post.id)}
                      className="h-4 w-4 shrink-0"
                    />

                    {/* Time */}
                    <div className="shrink-0 text-center w-14">
                      <p className="text-sm font-semibold">
                        {new Date(post.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Thumbnail */}
                    {post.media_urls?.[0] ? (
                      <img
                        src={post.media_urls[0]}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                        <span className="text-lg">✏️</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.caption || "(Sin caption)"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${meta.platforms[post.platform]?.color || "var(--muted-foreground)"}20`,
                            color: meta.platforms[post.platform]?.color || "var(--muted-foreground)",
                          }}
                        >
                          {meta.platforms[post.platform]?.label || post.platform}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">{post.type}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className="shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${meta.statuses[post.status]?.color || "var(--muted-foreground)"}20`,
                        color: meta.statuses[post.status]?.color || "var(--muted-foreground)",
                      }}
                    >
                      {meta.statuses[post.status]?.label || post.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
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
                  {new Date(modal.post.scheduled_at).toLocaleString("es-ES")}
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
