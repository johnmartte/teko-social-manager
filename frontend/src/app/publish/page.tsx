"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import ImageUpload from "@/components/ImageUpload";
import { api } from "@/lib/api";

type Tab = "ig-photo" | "ig-reel" | "ig-carousel" | "fb-post" | "fb-photo";
type Mode = "now" | "schedule" | "bulk";

type BulkItem = {
  id: string;
  platform: "instagram" | "facebook" | "both";
  type: "photo" | "reel" | "carousel" | "text";
  caption: string;
  mediaUrls: string[];
  scheduledAt: string;
};

export default function PublishPage() {
  const { status } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("ig-photo");
  const [mode, setMode] = useState<Mode>("now");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(path: string, body: Record<string, unknown>) {
    setSubmitting(true);
    try {
      await api(path, { method: "POST", body });
      showToast("success", "Publicado correctamente.");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSchedule(scheduleBody: {
    platform: string;
    type: string;
    caption?: string;
    media_urls?: string[];
    scheduled_at: string;
  }) {
    setSubmitting(true);
    try {
      await api("/scheduled-posts", { method: "POST", body: scheduleBody });
      showToast("success", "Post programado correctamente.");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error al programar.");
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { id: Tab; label: string; platform: "ig" | "fb" }[] = [
    { id: "ig-photo", label: "IG Foto", platform: "ig" },
    { id: "ig-reel", label: "IG Reel", platform: "ig" },
    { id: "ig-carousel", label: "IG Carrusel", platform: "ig" },
    { id: "fb-post", label: "FB Texto", platform: "fb" },
    { id: "fb-photo", label: "FB Foto", platform: "fb" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Publicar</h1>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {(["now", "schedule", "bulk"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === m
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {m === "now" ? "Ahora" : m === "schedule" ? "Programar" : "Múltiples"}
            </button>
          ))}
        </div>
      </div>

      {mode === "bulk" ? (
        <BulkScheduler igConnected={!!igConnected} fbConnected={!!fbConnected} onToast={showToast} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => {
              const disabled = tab.platform === "ig" ? !igConnected : !fbConnected;
              return (
                <button
                  key={tab.id}
                  disabled={disabled}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? tab.platform === "ig"
                        ? "bg-accent text-white"
                        : "bg-fb text-white"
                      : disabled
                      ? "bg-background text-muted/50 border border-border cursor-not-allowed"
                      : "bg-background text-foreground border border-border hover:border-foreground/20"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Forms */}
          {activeTab === "ig-photo" && (
            <IGPhotoForm onSubmit={handleSubmit} onSchedule={handleSchedule} submitting={submitting} mode={mode} />
          )}
          {activeTab === "ig-reel" && (
            <IGReelForm onSubmit={handleSubmit} onSchedule={handleSchedule} submitting={submitting} mode={mode} />
          )}
          {activeTab === "ig-carousel" && (
            <IGCarouselForm onSubmit={handleSubmit} onSchedule={handleSchedule} submitting={submitting} mode={mode} />
          )}
          {activeTab === "fb-post" && (
            <FBPostForm onSubmit={handleSubmit} onSchedule={handleSchedule} submitting={submitting} mode={mode} />
          )}
          {activeTab === "fb-photo" && (
            <FBPhotoForm onSubmit={handleSubmit} onSchedule={handleSchedule} submitting={submitting} mode={mode} />
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-success-light text-green-800 border border-success"
              : "bg-red-50 text-red-700 border border-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Shared ScheduleInput ─────────────────────────────────────────────────────

function ScheduleInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const min = new Date(Date.now() + 60_000).toISOString().slice(0, 16);
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">Fecha y hora de publicación</label>
      <input
        type="datetime-local"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

// ─── Form types ───────────────────────────────────────────────────────────────

type FormProps = {
  onSubmit: (path: string, body: Record<string, unknown>) => Promise<void>;
  onSchedule: (body: {
    platform: string;
    type: string;
    caption?: string;
    media_urls?: string[];
    scheduled_at: string;
  }) => Promise<void>;
  submitting: boolean;
  mode: Mode;
};

// ─── IG Photo ────────────────────────────────────────────────────────────────

function IGPhotoForm({ onSubmit, onSchedule, submitting, mode }: FormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  function handleAction() {
    if (mode === "schedule") {
      onSchedule({ platform: "instagram", type: "photo", caption, media_urls: [url], scheduled_at: scheduledAt });
    } else {
      onSubmit("/instagram/publish/photo", { image_url: url, caption });
    }
  }

  return (
    <Card title="Publicar foto en Instagram" color="#e1306c">
      <div className="space-y-3">
        <ImageUpload value={url} onChange={setUrl} accept="image/*" label="imagen" accentColor="#e1306c" />
        <textarea placeholder="Pie de foto (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none" />
        {mode === "schedule" && <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />}
        <button
          disabled={!url || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "..." : mode === "schedule" ? "Programar foto" : "Publicar foto"}
        </button>
      </div>
    </Card>
  );
}

// ─── IG Reel ─────────────────────────────────────────────────────────────────

function IGReelForm({ onSubmit, onSchedule, submitting, mode }: FormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  function handleAction() {
    if (mode === "schedule") {
      onSchedule({ platform: "instagram", type: "reel", caption, media_urls: [url], scheduled_at: scheduledAt });
    } else {
      onSubmit("/instagram/publish/reel", { video_url: url, caption });
    }
  }

  return (
    <Card title="Publicar Reel en Instagram" color="#f5a623">
      <div className="space-y-3">
        <ImageUpload value={url} onChange={setUrl} accept="video/*" label="video" accentColor="#f5a623" />
        <textarea placeholder="Descripción (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-warning resize-none" />
        {mode === "schedule" && <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />}
        <button
          disabled={!url || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className="bg-warning text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "..." : mode === "schedule" ? "Programar Reel" : "Publicar Reel"}
        </button>
      </div>
    </Card>
  );
}

// ─── IG Carousel ─────────────────────────────────────────────────────────────

function IGCarouselForm({ onSubmit, onSchedule, submitting, mode }: FormProps) {
  const [images, setImages] = useState<string[]>([""]);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const validUrls = images.filter(Boolean);

  function handleAction() {
    if (mode === "schedule") {
      onSchedule({ platform: "instagram", type: "carousel", caption, media_urls: validUrls, scheduled_at: scheduledAt });
    } else {
      onSubmit("/instagram/publish/carousel", { image_urls: validUrls, caption });
    }
  }

  return (
    <Card title="Publicar carrusel en Instagram" color="#7c3aed">
      <div className="space-y-4">
        {images.map((url, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">Imagen {i + 1}</span>
              {images.length > 1 && (
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="text-xs text-red-400 hover:text-red-600">
                  Quitar
                </button>
              )}
            </div>
            <ImageUpload value={url} onChange={(u) => { const next = [...images]; next[i] = u; setImages(next); }} accept="image/*" label="imagen" accentColor="#7c3aed" />
          </div>
        ))}
        {images.length < 10 && (
          <button type="button" onClick={() => setImages([...images, ""])} className="w-full py-2 border border-dashed border-border rounded-xl text-xs text-muted hover:text-foreground hover:border-foreground/20 transition-colors">
            + Agregar imagen ({images.length}/10)
          </button>
        )}
        <textarea placeholder="Descripción del carrusel (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7c3aed] resize-none" />
        {mode === "schedule" && <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />}
        <button
          disabled={validUrls.length < 2 || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className="bg-[#7c3aed] text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "..." : mode === "schedule" ? `Programar carrusel (${validUrls.length})` : `Publicar carrusel (${validUrls.length} imágenes)`}
        </button>
      </div>
    </Card>
  );
}

// ─── FB Post ─────────────────────────────────────────────────────────────────

function FBPostForm({ onSubmit, onSchedule, submitting, mode }: FormProps) {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  function handleAction() {
    if (mode === "schedule") {
      onSchedule({ platform: "facebook", type: "text", caption: message, scheduled_at: scheduledAt });
    } else {
      onSubmit("/facebook/page/publish", { message, link: link || undefined });
    }
  }

  return (
    <Card title="Publicar en Facebook" color="#1877f2">
      <div className="space-y-3">
        <textarea placeholder="¿Qué quieres publicar?" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none" />
        {mode !== "schedule" && (
          <input type="url" placeholder="Enlace (opcional)" value={link} onChange={(e) => setLink(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb" />
        )}
        {mode === "schedule" && <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />}
        <button
          disabled={!message || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className="bg-fb text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "..." : mode === "schedule" ? "Programar en Facebook" : "Publicar en Facebook"}
        </button>
      </div>
    </Card>
  );
}

// ─── FB Photo ─────────────────────────────────────────────────────────────────

function FBPhotoForm({ onSubmit, onSchedule, submitting, mode }: FormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  function handleAction() {
    if (mode === "schedule") {
      onSchedule({ platform: "facebook", type: "photo", caption, media_urls: [url], scheduled_at: scheduledAt });
    } else {
      onSubmit("/facebook/page/publish/photo", { image_url: url, caption });
    }
  }

  return (
    <Card title="Publicar foto en Facebook" color="#1877f2">
      <div className="space-y-3">
        <ImageUpload value={url} onChange={setUrl} accept="image/*" label="imagen" accentColor="#1877f2" />
        <textarea placeholder="Descripción (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none" />
        {mode === "schedule" && <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />}
        <button
          disabled={!url || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className="bg-fb text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "..." : mode === "schedule" ? "Programar foto" : "Publicar foto"}
        </button>
      </div>
    </Card>
  );
}

// ─── Bulk Scheduler ───────────────────────────────────────────────────────────

function BulkScheduler({
  igConnected,
  fbConnected,
  onToast,
}: {
  igConnected: boolean;
  fbConnected: boolean;
  onToast: (type: "success" | "error", msg: string) => void;
}) {
  const [items, setItems] = useState<BulkItem[]>([newItem()]);
  const [submitting, setSubmitting] = useState(false);

  function newItem(): BulkItem {
    return {
      id: Math.random().toString(36).slice(2),
      platform: igConnected ? "instagram" : "facebook",
      type: "photo",
      caption: "",
      mediaUrls: [""],
      scheduledAt: "",
    };
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<BulkItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function scheduleAll() {
    setSubmitting(true);
    let ok = 0;
    let fail = 0;
    for (const item of items) {
      const urls = item.mediaUrls.filter(Boolean);
      try {
        await api("/scheduled-posts", {
          method: "POST",
          body: {
            platform: item.platform,
            type: item.type,
            caption: item.caption || undefined,
            media_urls: urls.length ? urls : undefined,
            scheduled_at: item.scheduledAt,
          },
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setSubmitting(false);
    if (fail === 0) {
      onToast("success", `${ok} post(s) programados correctamente.`);
      setItems([newItem()]);
    } else {
      onToast("error", `${ok} programados, ${fail} fallaron.`);
    }
  }

  const canSubmit =
    !submitting &&
    items.every(
      (i) =>
        i.scheduledAt &&
        (i.type === "text" || i.mediaUrls.some(Boolean))
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Programa múltiples posts a la vez. Cada uno se publicará en la fecha y hora indicada.
      </p>

      {items.map((item, idx) => (
        <Card key={item.id}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Post {idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-600">
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Platform */}
              <div className="space-y-1">
                <label className="text-xs text-muted font-medium">Plataforma</label>
                <select
                  value={item.platform}
                  onChange={(e) => updateItem(item.id, { platform: e.target.value as BulkItem["platform"] })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {igConnected && <option value="instagram">Instagram</option>}
                  {fbConnected && <option value="facebook">Facebook</option>}
                  {igConnected && fbConnected && <option value="both">Ambas</option>}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs text-muted font-medium">Tipo</label>
                <select
                  value={item.type}
                  onChange={(e) => updateItem(item.id, { type: e.target.value as BulkItem["type"] })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="photo">Foto</option>
                  <option value="reel">Reel</option>
                  <option value="carousel">Carrusel</option>
                  {item.platform !== "instagram" && <option value="text">Solo texto</option>}
                </select>
              </div>
            </div>

            {/* Media */}
            {item.type !== "text" && (
              <ImageUpload
                value={item.mediaUrls[0] || ""}
                onChange={(u) => updateItem(item.id, { mediaUrls: [u] })}
                accept={item.type === "reel" ? "video/*" : "image/*"}
                label={item.type === "reel" ? "video" : "imagen"}
                accentColor="#e1306c"
              />
            )}

            {/* Caption */}
            <textarea
              placeholder="Caption / mensaje..."
              value={item.caption}
              onChange={(e) => updateItem(item.id, { caption: e.target.value })}
              rows={2}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
            />

            {/* Date */}
            <ScheduleInput
              value={item.scheduledAt}
              onChange={(v) => updateItem(item.id, { scheduledAt: v })}
            />
          </div>
        </Card>
      ))}

      <button
        onClick={addItem}
        className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        + Agregar otro post
      </button>

      <button
        onClick={scheduleAll}
        disabled={!canSubmit}
        className="w-full py-3 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {submitting ? "Programando..." : `Programar ${items.length} post(s)`}
      </button>
    </div>
  );
}
