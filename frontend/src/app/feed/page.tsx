"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Film,
  Layers,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  Trash2,
  CalendarClock,
  ImageOff,
  Merge,
  Scissors,
  Check,
  X,
} from "lucide-react";
import { api, formatNum } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Campaign, InstagramProfile, MediaItem, ScheduledPost } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";
import FolderImport from "@/components/FolderImport";
import { useToast } from "@/components/Toaster";

const SWATCHES = ["#d7f36a", "#c4b5fd", "#a7e8c9", "#f6e27f", "#f7a8cf", "#a9cdf5", "#f7c09b"];

const STATUS_LABEL: Record<ScheduledPost["status"], string> = {
  draft: "Borrador",
  pending: "Programado",
  failed: "Falló",
  published: "Publicado",
};

/** Orden del feed: posición manual primero; sin posición, el más tardío arriba (como Instagram). */
const isVideoUrl = (u: string) => /\.(mp4|mov|webm)(\?|$)/i.test(u);
const MAX_SLIDES = 10; // límite de Instagram por carrusel

function feedSort(a: ScheduledPost, b: ScheduledPost) {
  if (a.feed_position != null && b.feed_position != null) return a.feed_position - b.feed_position;
  if (a.feed_position != null) return -1;
  if (b.feed_position != null) return 1;
  return (b.scheduled_at ?? "9999").localeCompare(a.scheduled_at ?? "9999");
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shortDate(iso: string | null) {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedPlanner />
    </Suspense>
  );
}

function FeedPlanner() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [live, setLive] = useState<MediaItem[]>([]);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [view, setView] = useState<"feed" | "carousels">("feed");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(params.get("new") === "campaign");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const campaignFilter = params.get("campaign") ? Number(params.get("campaign")) : null;

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api<ScheduledPost[]>("/scheduled-posts"),
        api<Campaign[]>("/campaigns"),
      ]);
      setPosts(p);
      setCampaigns(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!status?.instagram.connected) return;
    api<InstagramProfile>("/instagram/profile").then(setProfile).catch(() => {});
    api<{ data: MediaItem[] }>("/instagram/media?limit=12")
      .then((r) => setLive(r.data ?? []))
      .catch(() => {});
  }, [status?.instagram.connected]);

  // Solo lo que todavía no está en Instagram; lo publicado llega por `live`.
  const planned = useMemo(
    () => posts.filter((p) => p.platform !== "facebook" && p.status !== "published").sort(feedSort),
    [posts]
  );
  const selected = planned.find((p) => p.id === selectedId) ?? null;
  const campaignById = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const activeCampaign = campaignFilter ? campaignById.get(campaignFilter) ?? null : null;

  function setFilter(id: number | null) {
    router.replace(id ? `/feed?campaign=${id}` : "/feed", { scroll: false });
  }

  async function persistOrder(next: ScheduledPost[]) {
    const ids = next.map((p) => p.id);
    setPosts((prev) =>
      prev.map((p) => (ids.includes(p.id) ? { ...p, feed_position: ids.indexOf(p.id) } : p))
    );
    try {
      await api("/scheduled-posts/reorder", { method: "POST", body: { ids } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el orden");
      load();
    }
  }

  function move(fromId: number, toId: number) {
    if (fromId === toId) return;
    const next = [...planned];
    const from = next.findIndex((p) => p.id === fromId);
    const to = next.findIndex((p) => p.id === toId);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistOrder(next);
  }

  function nudge(id: number, delta: number) {
    const i = planned.findIndex((p) => p.id === id);
    const j = i + delta;
    if (j < 0 || j >= planned.length) return;
    move(id, planned[j].id);
  }

  async function createDraft() {
    try {
      const post = await api<ScheduledPost>("/scheduled-posts", {
        method: "POST",
        body: {
          platform: "instagram",
          type: "photo",
          status: "draft",
          caption: "",
          media_urls: [],
          campaign_id: campaignFilter,
        },
      });
      // Un borrador nuevo entra arriba a la izquierda: es el próximo en salir.
      const next = [post, ...planned];
      setPosts((prev) => [post, ...prev]);
      setSelectedId(post.id);
      persistOrder(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el borrador");
    }
  }

  async function savePost(id: number, patch: Partial<ScheduledPost>) {
    try {
      const updated = await api<ScheduledPost>(`/scheduled-posts/${id}`, { method: "PATCH", body: patch });
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setError(null);
      if (patch.campaign_id !== undefined) api<Campaign[]>("/campaigns").then(setCampaigns).catch(() => {});
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      return false;
    }
  }

  function togglePick(id: number) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function stopSelecting() {
    setSelecting(false);
    setPicked([]);
  }

  /** Une los posts elegidos (en el orden del feed) en un solo carrusel; el primero lo conserva. Se puede deshacer separando. */
  async function mergePicked() {
    const chosen = planned.filter((p) => picked.includes(p.id));
    if (chosen.length < 2) return;
    const urls = chosen.flatMap((p) => p.media_urls ?? []);
    if (urls.length > MAX_SLIDES) {
      toast("error", "Demasiadas láminas", `Un carrusel admite ${MAX_SLIDES} y seleccionaste ${urls.length}.`);
      return;
    }
    if (urls.some(isVideoUrl)) {
      toast("error", "No se pueden unir videos", "Los carruseles solo admiten imágenes.");
      return;
    }
    const [target, ...rest] = chosen;
    try {
      const updated = await api<ScheduledPost>(`/scheduled-posts/${target.id}`, {
        method: "PATCH",
        body: { media_urls: urls, type: "carousel" },
      });
      await Promise.all(rest.map((p) => api(`/scheduled-posts/${p.id}`, { method: "DELETE" })));
      const gone = new Set(rest.map((p) => p.id));
      setPosts((prev) => prev.filter((p) => !gone.has(p.id)).map((p) => (p.id === target.id ? { ...p, ...updated } : p)));
      stopSelecting();
      setSelectedId(target.id);
      toast("success", `${chosen.length} posts unidos en un carrusel`, "Si te arrepientes, ábrelo y sepáralo.");
    } catch (e) {
      toast("error", "No se pudo unir", e instanceof Error ? e.message : undefined);
      load();
    }
  }

  /** Saca láminas de un carrusel: cada una pasa a ser un borrador propio, justo detrás del original. */
  async function extractSlides(post: ScheduledPost, base: string[], urls: string[]): Promise<string[] | null> {
    try {
      const created: ScheduledPost[] = [];
      for (const url of urls) {
        created.push(
          await api<ScheduledPost>("/scheduled-posts", {
            method: "POST",
            body: {
              platform: "instagram",
              type: isVideoUrl(url) ? "reel" : "photo",
              status: "draft",
              caption: "",
              media_urls: [url],
              campaign_id: post.campaign_id,
            },
          })
        );
      }
      const remaining = base.filter((u) => !urls.includes(u));
      const type = remaining.length > 1 ? "carousel" : remaining[0] && isVideoUrl(remaining[0]) ? "reel" : "photo";
      const updated = await api<ScheduledPost>(`/scheduled-posts/${post.id}`, {
        method: "PATCH",
        body: { media_urls: remaining, type },
      });
      setPosts((prev) => [...prev.map((p) => (p.id === post.id ? { ...p, ...updated } : p)), ...created]);
      persistOrder(planned.flatMap((p) => (p.id === post.id ? [p, ...created] : [p])));
      toast("success", created.length === 1 ? "Lámina separada" : `${created.length} láminas separadas`, "Ahora son posts independientes en tu feed.");
      return remaining;
    } catch (e) {
      toast("error", "No se pudo separar", e instanceof Error ? e.message : undefined);
      return null;
    }
  }

  async function deletePost(id: number) {
    try {
      await api(`/scheduled-posts/${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      setPendingDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  async function deleteCampaign(c: Campaign) {
    try {
      await api(`/campaigns/${c.id}`, { method: "DELETE" });
      setFilter(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la campaña");
    }
  }

  const counts = useMemo(() => {
    const draft = planned.filter((p) => p.status === "draft").length;
    return { draft, scheduled: planned.length - draft };
  }, [planned]);

  return (
    <div className="teko-enter grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="pill-track overflow-x-auto max-w-full" role="tablist" aria-label="Filtrar por campaña">
            <button role="tab" data-active={!campaignFilter} aria-selected={!campaignFilter} onClick={() => setFilter(null)}>
              {!campaignFilter && <span className="glow-dot" />}
              Todo el feed
            </button>
            {campaigns.map((c) => (
              <button
                key={c.id}
                role="tab"
                data-active={campaignFilter === c.id}
                aria-selected={campaignFilter === c.id}
                onClick={() => setFilter(c.id)}
                className="whitespace-nowrap"
              >
                <span className="size-2 rounded-[3px]" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setSelectedId(null); setShowCampaignForm(true); }} className="h-10 rounded-full px-4">
              <Plus className="size-4" />
              Nueva campaña
            </Button>
            <FolderImport campaignId={campaignFilter} onImported={load} />
            <Button onClick={createDraft} className="h-10 rounded-full px-4">
              <Plus className="size-4" />
              Nuevo borrador
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="pill-track" role="tablist" aria-label="Vista">
            {(["feed", "carousels"] as const).map((v) => (
              <button key={v} role="tab" data-active={view === v} aria-selected={view === v} onClick={() => { setView(v); stopSelecting(); }}>
                {v === "feed" ? "Feed" : "Carruseles"}
              </button>
            ))}
          </div>
          {view === "feed" && (
            <Button variant={selecting ? "default" : "outline"} onClick={() => {
                if (selecting) return stopSelecting();
                setSelectedId(null);
                setSelecting(true);
              }} className="h-10 rounded-full px-4">
              <Merge className="size-4" />
              {selecting ? "Cancelar selección" : "Seleccionar y unir"}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-error border border-error-border bg-error-light rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            {error}
            <button onClick={() => setError(null)} aria-label="Cerrar aviso">
              <X className="size-4" />
            </button>
          </p>
        )}

        {view === "carousels" ? (
          <CarouselsView
            posts={planned.filter((p) => (p.media_urls?.length ?? 0) > 1 && (campaignFilter == null || p.campaign_id === campaignFilter))}
            campaignById={campaignById}
            selectedId={selectedId}
            onOpen={setSelectedId}
          />
        ) : (
        <div className="teko-card dot-grid p-4 sm:p-8">
          <div className="mx-auto max-w-[520px] rounded-[28px] bg-card border border-border shadow-[0_30px_80px_-30px_var(--shadow-lg)] overflow-hidden">
            <ProfileHeader
              profile={profile}
              plannedCount={planned.length}
              campaign={activeCampaign}
            />

            {loading ? (
              <div className="grid grid-cols-3 gap-[3px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[3px]">
                {planned.map((p) => {
                  const campaign = p.campaign_id ? campaignById.get(p.campaign_id) : undefined;
                  const dimmed = campaignFilter != null && p.campaign_id !== campaignFilter;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedId(p.id);
                        if (e.key === "Delete" || e.key === "Backspace") setPendingDelete(p.id);
                      }}
                      draggable={!selecting}
                      onDragStart={(e) => {
                        setDragId(p.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (overId !== p.id) setOverId(p.id);
                      }}
                      onDragLeave={() => setOverId((o) => (o === p.id ? null : o))}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragId != null) move(dragId, p.id);
                        setDragId(null);
                        setOverId(null);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      onClick={() => (selecting ? togglePick(p.id) : setSelectedId(p.id))}
                      aria-label={`Post ${STATUS_LABEL[p.status]} ${shortDate(p.scheduled_at)}${campaign ? `, campaña ${campaign.name}` : ""}`}
                      className={cn(
                        "group relative aspect-[3/4] overflow-hidden bg-muted text-left cursor-grab active:cursor-grabbing outline-none transition-all",
                        dimmed && "opacity-25 saturate-0",
                        dragId === p.id && "opacity-40",
                        overId === p.id && dragId !== p.id && "ring-2 ring-inset ring-primary",
                        selectedId === p.id && "ring-2 ring-inset ring-foreground",
                        picked.includes(p.id) && "ring-4 ring-inset ring-primary",
                        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      )}
                    >
                      <Tile post={p} />
                      {selecting && (
                        <span className={cn("absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full border-2 border-white text-white", picked.includes(p.id) ? "bg-primary" : "bg-black/40")}>
                          {picked.includes(p.id) && <Check className="size-3.5" />}
                        </span>
                      )}
                      {campaign && (
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: campaign.color }} />
                      )}
                      <span className="absolute inset-x-0 bottom-0 p-2 flex items-end justify-between gap-1 bg-gradient-to-t from-black/65 to-transparent pt-8">
                        <span className="text-[10.5px] font-medium text-white/90 tabular-nums">{shortDate(p.scheduled_at)}</span>
                        <StatusChip status={p.status} />
                      </span>
                      <GripVertical className="absolute top-2 left-2 size-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      <button
                        type="button"
                        aria-label="Eliminar post"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(p.id);
                        }}
                        className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-error hover:text-ink transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      {pendingDelete === p.id && (
                        <span
                          className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs font-medium">¿Eliminar este post?</span>
                          <span className="flex gap-1.5">
                            <button type="button" onClick={() => deletePost(p.id)} className="h-7 px-3 rounded-full bg-error text-ink text-xs font-semibold">
                              Eliminar
                            </button>
                            <button type="button" onClick={() => setPendingDelete(null)} className="h-7 px-3 rounded-full bg-white/15 text-xs">
                              Cancelar
                            </button>
                          </span>
                        </span>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={createDraft}
                  className="aspect-[3/4] border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
                >
                  <span className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Plus className="size-4" />
                  </span>
                  <span className="text-xs">Añadir</span>
                </button>

                {live.map((m) => (
                  <a
                    key={m.id}
                    href={m.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className={cn("relative aspect-[3/4] overflow-hidden bg-muted", campaignFilter && "opacity-25 saturate-0")}
                    title="Ya publicado"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbnail_url || m.media_url} alt={m.caption?.slice(0, 80) || ""} className="size-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {selecting && (
            <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-popover/95 px-5 py-2.5 shadow-xl backdrop-blur">
              <span className="text-sm">
                {picked.length === 0 ? "Toca los posts que quieras unir" : `${picked.length} seleccionado(s)`}
              </span>
              <Button size="sm" disabled={picked.length < 2} onClick={() => void mergePicked()}>
                <Merge className="size-4" />
                Unir en carrusel
              </Button>
              <Button size="sm" variant="ghost" onClick={stopSelecting}>Cancelar</Button>
            </div>
          )}

          {dragId != null && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(-1);
              }}
              onDragLeave={() => setOverId((o) => (o === -1 ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId != null) deletePost(dragId);
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 h-14 px-7 rounded-full border-2 border-dashed text-sm font-medium backdrop-blur transition-colors",
                overId === -1 ? "bg-error text-ink border-transparent" : "bg-popover/95 text-foreground border-ring"
              )}
            >
              <Trash2 className="size-4" />
              Suelta aquí para eliminar
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-5">
            Arrastra para reordenar o suéltalo en la papelera para eliminarlo. Arriba a la izquierda va lo próximo en publicarse
            {live.length > 0 ? "; después aparece lo que ya está en tu perfil." : "."}
          </p>
        </div>
        )}
      </section>

      <aside className="space-y-5 min-w-0">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Borradores" value={counts.draft} tone="bg-lilac" />
          <Metric label="Programados" value={counts.scheduled} tone="bg-mint" />
        </div>

        {selected ? (
          <PostEditor
            key={selected.id}
            post={selected}
            campaigns={campaigns}
            index={planned.findIndex((p) => p.id === selected.id)}
            total={planned.length}
            onClose={() => setSelectedId(null)}
            onSave={(patch) => savePost(selected.id, patch)}
            onDelete={() => deletePost(selected.id)}
            onNudge={(d) => nudge(selected.id, d)}
            onExtract={(base, urls) => extractSlides(selected, base, urls)}
          />
        ) : (
          <CampaignPanel
            campaigns={campaigns}
            posts={planned}
            active={activeCampaign}
            showForm={showCampaignForm}
            setShowForm={setShowCampaignForm}
            onSelect={setFilter}
            onCreated={(c) => {
              setCampaigns((prev) => [...prev, { ...c, posts_count: 0 }]);
              setShowCampaignForm(false);
              setFilter(c.id);
            }}
            onUpdated={(updated) => {
              setCampaigns((prev) => prev.map((campaign) => campaign.id === updated.id ? updated : campaign));
              setEditingCampaign(null);
            }}
            onDelete={deleteCampaign}
            editingCampaign={editingCampaign}
            setEditingCampaign={setEditingCampaign}
          />
        )}
      </aside>
    </div>
  );
}

function ProfileHeader({
  profile,
  plannedCount,
  campaign,
}: {
  profile: InstagramProfile | null;
  plannedCount: number;
  campaign: Campaign | null;
}) {
  return (
    <div className="px-5 pt-5 pb-4 border-b border-border">
      <div className="flex items-center gap-5">
        <div className="size-[68px] rounded-full p-[2px] bg-gradient-to-tr from-butter via-rose to-lilac shrink-0">
          {profile?.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profile_picture_url} alt="" className="size-full rounded-full object-cover border-2 border-card" />
          ) : (
            <div className="size-full rounded-full bg-muted border-2 border-card" />
          )}
        </div>
        <div className="flex-1 grid grid-cols-3 text-center">
          <Stat value={profile ? formatNum(profile.media_count + plannedCount) : String(plannedCount)} label="posts" />
          <Stat value={profile ? formatNum(profile.followers_count) : "—"} label="seguidores" />
          <Stat value={String(plannedCount)} label="en plan" />
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold">
        {campaign?.profile_name || (profile ? `@${profile.username}` : "Vista previa del perfil")}
      </p>
      {campaign ? (
        <div className="mt-1 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-[3px]" style={{ background: campaign.color }} />
            Mostrando la campaña <span className="text-foreground">{campaign.name}</span>
          </p>
          {(campaign.profile_bio || campaign.description) && (
            <p className="whitespace-pre-line text-xs text-muted-foreground">
              {campaign.profile_bio || campaign.description}
            </p>
          )}
          {campaign.profile_website && (
            <a href={campaign.profile_website} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">
              {campaign.profile_website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      ) : (
        !profile && <p className="mt-1 text-xs text-muted-foreground">Conecta Instagram para mezclar con tus publicaciones reales.</p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[15px] font-semibold tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function CarouselsView({
  posts,
  campaignById,
  selectedId,
  onOpen,
}: {
  posts: ScheduledPost[];
  campaignById: Map<number, Campaign>;
  selectedId: number | null;
  onOpen: (id: number) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="teko-card p-10 text-center text-sm text-muted-foreground">
        Aún no tienes carruseles. Importa una carpeta con varias imágenes o une posts desde el feed.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {posts.map((p, n) => {
        const campaign = p.campaign_id ? campaignById.get(p.campaign_id) : undefined;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(p.id)}
            className={cn(
              "teko-card block w-full space-y-3 p-4 text-left transition-colors hover:border-ring",
              selectedId === p.id && "ring-2 ring-foreground"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold">
                Carrusel {n + 1}
                {p.caption ? ` · ${p.caption.slice(0, 50)}` : ""}
              </p>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {campaign && <span className="size-2 rounded-[3px]" style={{ background: campaign.color }} />}
                {p.media_urls?.length} láminas · {STATUS_LABEL[p.status]}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {p.media_urls?.map((url, i) => (
                <div key={`${url}-${i}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Lámina ${i + 1}`} className="size-full object-cover" />
                  <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] font-semibold tabular-nums text-white">{i + 1}</span>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Tile({ post }: { post: ScheduledPost }) {
  const src = post.media_urls?.[0];
  return (
    <>
      {src ? (
        post.type === "reel" && /\.(mp4|mov|webm)(\?|$)/i.test(src) ? (
          <video src={src} muted className="size-full object-cover pointer-events-none" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" draggable={false} className="size-full object-cover pointer-events-none" />
        )
      ) : (
        <span className="size-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground px-3 text-center">
          <ImageOff className="size-5" strokeWidth={1.5} />
          <span className="text-[11px] line-clamp-3">{post.caption || "Sin imagen"}</span>
        </span>
      )}
      {post.type !== "photo" && (
        <span className="absolute top-2 right-2 flex items-center gap-1 text-white drop-shadow">
          {post.type === "carousel" && (post.media_urls?.length ?? 0) > 1 && (
            <span className="text-[11px] font-semibold tabular-nums">{post.media_urls?.length}</span>
          )}
          {post.type === "reel" ? <Film className="size-4" /> : <Layers className="size-4" />}
        </span>
      )}
    </>
  );
}

function StatusChip({ status }: { status: ScheduledPost["status"] }) {
  const tone = {
    draft: "bg-white/85 text-ink",
    pending: "bg-mint text-ink",
    failed: "bg-rose text-ink",
    published: "bg-sky text-ink",
  }[status];
  return <span className={cn("rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold", tone)}>{STATUS_LABEL[status]}</span>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn("rounded-[18px] p-4 text-ink", tone)}>
      <p className="text-[28px] font-semibold leading-none tabular-nums">{value}</p>
      <p className="text-xs mt-2 opacity-70">{label}</p>
    </div>
  );
}

function CampaignPanel({
  campaigns,
  posts,
  active,
  showForm,
  setShowForm,
  onSelect,
  onCreated,
  onUpdated,
  onDelete,
  editingCampaign,
  setEditingCampaign,
}: {
  campaigns: Campaign[];
  posts: ScheduledPost[];
  active: Campaign | null;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  onSelect: (id: number | null) => void;
  onCreated: (c: Campaign) => void;
  onUpdated: (c: Campaign) => void;
  onDelete: (c: Campaign) => void;
  editingCampaign: Campaign | null;
  setEditingCampaign: (campaign: Campaign | null) => void;
}) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  return (
    <div className="teko-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">Campañas</h2>
        {!showForm && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5" />
            Nueva
          </Button>
        )}
      </div>

      {showForm && (
        <CampaignForm
          onCancel={() => setShowForm(false)}
          onCreated={onCreated}
          onUpdated={onUpdated}
          campaign={null}
        />
      )}

      {campaigns.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">
          Agrupa posts en una campaña para ver cómo se lee en el feed como conjunto.
        </p>
      ) : (
        <ul className="space-y-2 mt-1">
          {campaigns.map((c) => {
            const inPlan = posts.filter((p) => p.campaign_id === c.id);
            const scheduled = inPlan.filter((p) => p.status === "pending").length;
            const isActive = active?.id === c.id;
            return (
              <li key={c.id}>
                <div
                  className={cn(
                    "rounded-2xl border p-3.5 transition-colors",
                    isActive ? "border-ring bg-accent" : "border-border hover:bg-card-hover"
                  )}
                >
                  <button className="w-full text-left" onClick={() => onSelect(isActive ? null : c.id)}>
                    <div className="flex items-center gap-2.5">
                      <span className="size-3 rounded-[4px]" style={{ background: c.color }} />
                      <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {scheduled}/{inPlan.length} prog.
                      </span>
                    </div>
                    {(c.starts_on || c.ends_on) && (
                      <p className="text-xs text-muted-foreground mt-1.5 pl-5">
                        {c.starts_on ? shortDate(c.starts_on + "T12:00") : "…"} → {c.ends_on ? shortDate(c.ends_on + "T12:00") : "…"}
                      </p>
                    )}
                    {inPlan.length > 0 && (
                      <div className="mt-2.5 pl-5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(scheduled / inPlan.length) * 100}%`, background: c.color }}
                        />
                      </div>
                    )}
                  </button>
                  {isActive && (
                    <div className="flex justify-end mt-3">
                      {editingCampaign?.id === c.id ? (
                        <div className="w-full">
                          <CampaignForm
                            campaign={c}
                            onCancel={() => setEditingCampaign(null)}
                            onCreated={onCreated}
                            onUpdated={onUpdated}
                          />
                        </div>
                      ) : confirmingId === c.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Sus posts se conservan.</span>
                          <Button size="sm" variant="destructive" onClick={() => onDelete(c)}>Eliminar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingCampaign(c)}>Editar campaña</Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmingId(c.id)}>
                            <Trash2 className="size-3.5" />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground mt-5">Selecciona un post del feed para editarlo, asignarlo a una campaña o programarlo.</p>
    </div>
  );
}

function CampaignForm({
  onCancel,
  onCreated,
  onUpdated,
  campaign,
}: {
  onCancel: () => void;
  onCreated: (c: Campaign) => void;
  onUpdated: (c: Campaign) => void;
  campaign: Campaign | null;
}) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [color, setColor] = useState(campaign?.color ?? SWATCHES[0]);
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [profileName, setProfileName] = useState(campaign?.profile_name ?? "");
  const [profileBio, setProfileBio] = useState(campaign?.profile_bio ?? "");
  const [profileWebsite, setProfileWebsite] = useState(campaign?.profile_website ?? "");
  const [startsOn, setStartsOn] = useState(campaign?.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(campaign?.ends_on ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        color,
        description: description.trim() || null,
        profile_name: profileName.trim() || null,
        profile_bio: profileBio.trim() || null,
        profile_website: profileWebsite.trim() || null,
        starts_on: startsOn || null,
        ends_on: endsOn || null,
      };
      const c = await api<Campaign>(campaign ? `/campaigns/${campaign.id}` : "/campaigns", {
        method: campaign ? "PATCH" : "POST",
        body: payload,
      });
      campaign ? onUpdated(c) : onCreated(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-muted/40 p-4 mb-4 space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Nombre</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="Ej. Colección de invierno" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-description">Descripción interna</Label>
        <Textarea id="c-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Objetivo, audiencia y mensaje de la campaña…" />
      </div>
      <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3">
        <div>
          <p className="text-sm font-medium">Perfil para esta campaña</p>
          <p className="text-xs text-muted-foreground mt-1">Se muestra en la vista previa del Feed. No cambia automáticamente tu perfil real de Instagram.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-profile-name">Nombre visible</Label>
          <Input id="c-profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} maxLength={120} placeholder="Ej. Teko — Colección de invierno" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-profile-bio">Biografía de campaña</Label>
          <Textarea id="c-profile-bio" rows={3} value={profileBio} onChange={(e) => setProfileBio(e.target.value)} maxLength={150} placeholder="Una bio específica para esta campaña…" />
          <p className="text-right text-[11px] text-muted-foreground">{profileBio.length}/150</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-profile-website">Enlace del perfil</Label>
          <Input id="c-profile-website" type="url" value={profileWebsite} onChange={(e) => setProfileWebsite(e.target.value)} placeholder="https://teko.do/campana" />
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium mb-1.5">Color</legend>
        <div className="flex gap-2">
          {SWATCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setColor(s)}
              aria-label={`Color ${s}`}
              aria-pressed={color === s}
              className={cn("size-7 rounded-full ring-offset-2 ring-offset-card", color === s && "ring-2 ring-foreground")}
              style={{ background: s }}
            />
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-start">Inicio</Label>
          <input id="c-start" type="date" className="ui-control" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-end">Fin</Label>
          <input id="c-end" type="date" className="ui-control" value={endsOn} min={startsOn || undefined} onChange={(e) => setEndsOn(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Guardando…" : campaign ? "Guardar cambios" : "Crear campaña"}
        </Button>
      </div>
    </form>
  );
}

function PostEditor({
  post,
  campaigns,
  index,
  total,
  onClose,
  onSave,
  onDelete,
  onNudge,
  onExtract,
}: {
  post: ScheduledPost;
  campaigns: Campaign[];
  index: number;
  total: number;
  onClose: () => void;
  onSave: (patch: Partial<ScheduledPost>) => Promise<boolean>;
  onDelete: () => void;
  onNudge: (delta: number) => void;
  onExtract: (base: string[], urls: string[]) => Promise<string[] | null>;
}) {
  const [caption, setCaption] = useState(post.caption ?? "");
  const [media, setMedia] = useState<string[]>(post.media_urls ?? []);
  const [type, setType] = useState(post.type === "text" ? "photo" : post.type);
  const [when, setWhen] = useState(toLocalInput(post.scheduled_at));
  const [campaignId, setCampaignId] = useState<number | null>(post.campaign_id);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const draftPatch = {
    caption,
    type,
    media_urls: media,
    campaign_id: campaignId,
    scheduled_at: when ? new Date(when).toISOString() : null,
  } as Partial<ScheduledPost>;

  // Mantiene el formato coherente con el número de láminas (carrusel = 2 o más).
  function setSlides(next: string[]) {
    setMedia(next);
    if (next.length > 1 && type === "photo") setType("carousel");
    if (next.length <= 1 && type === "carousel") setType("photo");
  }

  function moveSlide(i: number, delta: number) {
    const next = [...media];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    setSlides(next);
  }

  async function extract(urls: string[]) {
    setSaving(true);
    const remaining = await onExtract(media, urls);
    if (remaining) {
      setMedia(remaining);
      setType(remaining.length > 1 ? "carousel" : remaining[0] && isVideoUrl(remaining[0]) ? "reel" : "photo");
    }
    setSaving(false);
  }

  const invalidCarousel = type === "carousel" && media.length < 2;

  async function save(status: ScheduledPost["status"]) {
    setSaving(true);
    await onSave({ ...draftPatch, status });
    setSaving(false);
  }

  return (
    <div className="teko-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Posición {index + 1} de {total}</p>
          <h2 className="text-[15px] font-semibold">{STATUS_LABEL[post.status]}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onNudge(-1)} disabled={index === 0} aria-label="Mover antes en el feed">
            <ArrowLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onNudge(1)} disabled={index === total - 1} aria-label="Mover después en el feed">
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar editor">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {post.status === "failed" && post.error_message && (
        <p className="text-xs text-error bg-error-light border border-error-border rounded-lg px-3 py-2">{post.error_message}</p>
      )}

      <div className="pill-track w-full" role="radiogroup" aria-label="Formato">
        {(["photo", "carousel", "reel"] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={type === t} data-active={type === t} onClick={() => setType(t)} className="flex-1 justify-center">
            {{ photo: "Foto", carousel: "Carrusel", reel: "Reel" }[t]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{type === "reel" ? "Video" : `Láminas (${media.length}/${MAX_SLIDES})`}</Label>
          {media.length > 1 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => extract(media.slice(1))}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Scissors className="size-3.5" />
              Separar todo en posts
            </button>
          )}
        </div>

        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((url, i) => (
              <div key={`${url}-${i}`} className="space-y-1">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted">
                  {isVideoUrl(url) ? (
                    <video src={url} muted className="size-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Lámina ${i + 1}`} className="size-full object-cover" />
                  )}
                  <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] font-semibold text-white tabular-nums">{i + 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" disabled={i === 0} onClick={() => moveSlide(i, -1)} aria-label="Mover antes" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" disabled={i === media.length - 1} onClick={() => moveSlide(i, 1)} aria-label="Mover después" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowRight className="size-3.5" />
                  </button>
                  {media.length > 1 && (
                    <button type="button" disabled={saving} onClick={() => extract([url])} aria-label="Separar como post" title="Separar como post" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <Scissors className="size-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => setSlides(media.filter((_, j) => j !== i))} aria-label="Quitar lámina" title="Quitar lámina" className="p-1 text-muted-foreground hover:text-error">
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(type !== "reel" || media.length === 0) && media.length < MAX_SLIDES && (
          <ImageUpload
            key={media.length}
            value=""
            onChange={(u) => u && setSlides([...media, u])}
            accept={type === "reel" ? "video/*" : "image/*"}
            label={type === "reel" ? "video" : media.length ? "otra lámina" : "imagen"}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-caption">Texto</Label>
        <Textarea id="p-caption" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Escribe el pie de foto…" />
        <p className="text-[11px] text-muted-foreground text-right tabular-nums">{caption.length}/2200</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="p-campaign">Campaña</Label>
          <select
            id="p-campaign"
            className="ui-control ui-select"
            value={campaignId ?? ""}
            onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Ninguna</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-when">Fecha</Label>
          <input id="p-when" type="datetime-local" className="ui-control" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="outline" disabled={saving} onClick={() => save("draft")} className="flex-1">
          Guardar borrador
        </Button>
        <Button disabled={saving || !when || media.length === 0 || invalidCarousel} onClick={() => save("pending")} className="flex-1" title={media.length === 0 ? "Añade una imagen" : invalidCarousel ? "Un carrusel necesita al menos 2 láminas" : !when ? "Elige una fecha" : undefined}>
          <CalendarClock className="size-4" />
          Programar
        </Button>
      </div>
      {confirmingDelete ? (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">¿Quitar este post del plan?</span>
          <Button size="sm" variant="destructive" onClick={onDelete}>Eliminar</Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancelar</Button>
        </div>
      ) : (
        <button onClick={() => setConfirmingDelete(true)} className="w-full text-xs text-muted-foreground hover:text-error flex items-center justify-center gap-1.5 pt-1">
          <Trash2 className="size-3.5" />
          Quitar del plan
        </button>
      )}
    </div>
  );
}
