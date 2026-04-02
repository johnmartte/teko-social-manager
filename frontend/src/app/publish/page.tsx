"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import ImageUpload from "@/components/ImageUpload";
import { api, getApiBaseUrl } from "@/lib/api";
import DatePicker from "react-datepicker";

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

const UPLOAD_BATCH_SIZE = 3;

type Option<T extends string> = {
  value: T;
  label: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Convert a local datetime string → UTC ISO so the backend never misinterprets timezone. */
function toUTCISO(localDatetime: string): string {
  if (!localDatetime) return localDatetime;
  const d = new Date(localDatetime);
  return isNaN(d.getTime()) ? localDatetime : d.toISOString();
}

function toDateOnly(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fromDateOnly(value: Date | null): string {
  if (!value) return "";
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
}

function toDateTime(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fromDateTime(value: Date | null): string {
  if (!value) return "";
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}T${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

function toTimeDate(value: string): Date {
  const base = new Date();
  if (!value) {
    base.setHours(10, 0, 0, 0);
    return base;
  }

  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    base.setHours(10, 0, 0, 0);
    return base;
  }

  base.setHours(hours, minutes, 0, 0);
  return base;
}

function fromTimeDate(value: Date | null): string {
  if (!value) return "";
  return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

function FancySelect<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Option<T>[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const activeLabel = options.find((opt) => opt.value === value)?.label || "Seleccionar";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`ui-control flex items-center justify-between text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span>{activeLabel}</span>
        <span className="text-muted text-xs">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${opt.value === value ? "bg-accent text-white" : "hover:bg-background"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getUploadHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const headers: Record<string, string> = {};
  const ig = localStorage.getItem("ig_token");
  const igUser = localStorage.getItem("ig_user_id");
  const fb = localStorage.getItem("fb_token");
  const fbPage = localStorage.getItem("fb_page_id");
  if (ig) headers["X-IG-Token"] = ig;
  if (igUser) headers["X-IG-User-Id"] = igUser;
  if (fb) headers["X-FB-Token"] = fb;
  if (fbPage) headers["X-FB-Page-Id"] = fbPage;
  return headers;
}

async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
    method: "POST",
    headers: getUploadHeaders(),
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data?.url) {
    throw new Error(data?.error || data?.message || "Error al subir archivo");
  }

  return String(data.url);
}

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
      await api("/scheduled-posts", {
        method: "POST",
        body: { ...scheduleBody, scheduled_at: toUTCISO(scheduleBody.scheduled_at) },
      });
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
    <div className={`space-y-6 ${mode === "now" ? "max-w-2xl" : "max-w-6xl"}`}>
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
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">Fecha y hora de publicación</label>
      <DatePicker
        selected={toDateTime(value)}
        onChange={(date: Date | null) => onChange(fromDateTime(date))}
        showTimeSelect
        timeIntervals={5}
        timeCaption="Hora"
        minDate={new Date()}
        dateFormat="dd/MM/yyyy h:mm aa"
        className="ui-control"
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
      <div className={mode === "schedule" ? "grid gap-4 lg:grid-cols-2" : "space-y-3"}>
        <ImageUpload value={url} onChange={setUrl} accept="image/*" label="imagen" accentColor="#e1306c" />
        <textarea placeholder="Pie de foto (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none" />
        {mode === "schedule" && (
          <div className="lg:col-span-2">
            <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />
          </div>
        )}
        <button
          disabled={!url || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className={`bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity ${mode === "schedule" ? "lg:col-span-2" : ""}`}
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
      <div className={mode === "schedule" ? "grid gap-4 lg:grid-cols-2" : "space-y-3"}>
        <ImageUpload value={url} onChange={setUrl} accept="video/*" label="video" accentColor="#f5a623" />
        <textarea placeholder="Descripción (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-warning resize-none" />
        {mode === "schedule" && (
          <div className="lg:col-span-2">
            <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />
          </div>
        )}
        <button
          disabled={!url || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className={`bg-warning text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity ${mode === "schedule" ? "lg:col-span-2" : ""}`}
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
      <div className={mode === "schedule" ? "grid gap-4 lg:grid-cols-2" : "space-y-4"}>
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
        </div>
        <div className="space-y-4">
          <textarea placeholder="Descripción del carrusel (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7c3aed] resize-none" />
          {mode === "schedule" && <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />}
          <button
            disabled={validUrls.length < 2 || submitting || (mode === "schedule" && !scheduledAt)}
            onClick={handleAction}
            className="w-full bg-[#7c3aed] text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? "..." : mode === "schedule" ? `Programar carrusel (${validUrls.length})` : `Publicar carrusel (${validUrls.length} imágenes)`}
          </button>
        </div>
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
      <div className={mode === "schedule" ? "grid gap-4 lg:grid-cols-2" : "space-y-3"}>
        <textarea placeholder="¿Qué quieres publicar?" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none" />
        {mode !== "schedule" ? (
          <input type="url" placeholder="Enlace (opcional)" value={link} onChange={(e) => setLink(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb" />
        ) : (
          <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />
        )}
        <button
          disabled={!message || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className={`bg-fb text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity ${mode === "schedule" ? "lg:col-span-2" : ""}`}
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
      <div className={mode === "schedule" ? "grid gap-4 lg:grid-cols-2" : "space-y-3"}>
        <ImageUpload value={url} onChange={setUrl} accept="image/*" label="imagen" accentColor="#1877f2" />
        <textarea placeholder="Descripción (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none" />
        {mode === "schedule" && (
          <div className="lg:col-span-2">
            <ScheduleInput value={scheduledAt} onChange={setScheduledAt} />
          </div>
        )}
        <button
          disabled={!url || submitting || (mode === "schedule" && !scheduledAt)}
          onClick={handleAction}
          className={`bg-fb text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity ${mode === "schedule" ? "lg:col-span-2" : ""}`}
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
  const [bulkMode, setBulkMode] = useState<"intelligent" | "manual">("intelligent");
  const [items, setItems] = useState<BulkItem[]>([newItem()]);
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [totalDays, setTotalDays] = useState(15);
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [timeSlots, setTimeSlots] = useState<string[]>(["10:00", "18:00"]);
  const [platform, setPlatform] = useState<BulkItem["platform"]>(igConnected ? "instagram" : "facebook");
  const [type, setType] = useState<Exclude<BulkItem["type"], "text">>("photo");
  const [uploadMode, setUploadMode] = useState<"individual" | "massive">("massive");
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [sameCaptionForAll, setSameCaptionForAll] = useState(true);
  const [globalCaption, setGlobalCaption] = useState("");
  const [captionsByPost, setCaptionsByPost] = useState<string[]>([]);
  const [uploadingPool, setUploadingPool] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openSections, setOpenSections] = useState({
    timing: true,
    captions: true,
    uploads: true,
  });

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
            scheduled_at: toUTCISO(item.scheduledAt),
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

  function dayFromOffset(base: Date, offset: number): Date {
    const next = new Date(base);
    next.setDate(base.getDate() + offset);
    return next;
  }

  function formatYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function asScheduledAt(date: Date, hhmm: string): string {
    return `${formatYMD(date)}T${hhmm}`;
  }

  function updateTimeSlot(index: number, value: string) {
    setTimeSlots((prev) => prev.map((slot, i) => (i === index ? value : slot)));
  }

  function toggleSection(section: "timing" | "captions" | "uploads") {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function syncTimeSlots(count: number) {
    const safeCount = Math.min(Math.max(count, 1), 8);
    setPostsPerDay(safeCount);
    setTimeSlots((prev) => {
      if (prev.length === safeCount) return prev;
      if (prev.length > safeCount) return prev.slice(0, safeCount);
      const additions = Array.from({ length: safeCount - prev.length }, (_, i) => {
        const hour = 10 + ((prev.length + i) % 10);
        return `${String(hour).padStart(2, "0")}:00`;
      });
      return [...prev, ...additions];
    });
  }

  const totalPosts = totalDays * postsPerDay;

  function ensureCaptionSlots(required: number) {
    setCaptionsByPost((prev) => {
      if (prev.length === required) return prev;
      if (prev.length > required) return prev.slice(0, required);
      return [...prev, ...Array.from({ length: required - prev.length }, () => "")];
    });
  }

  function fillFirstEmptySlots(current: string[], incoming: string[], limit: number): string[] {
    const next = Array.from({ length: limit }, (_, index) => current[index] || "");
    let cursor = 0;

    for (let i = 0; i < next.length && cursor < incoming.length; i++) {
      if (!next[i]) {
        next[i] = incoming[cursor];
        cursor++;
      }
    }

    return next;
  }

  async function handleMassiveUpload(files: FileList | null) {
    if (!files?.length) return;

    const queue = Array.from(files);
    setUploadingPool(true);
    setUploadProgress(0);

    const uploaded: string[] = [];
    let failures = 0;
    let processed = 0;

    for (let i = 0; i < queue.length; i += UPLOAD_BATCH_SIZE) {
      const batch = queue.slice(i, i + UPLOAD_BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const url = await uploadMedia(file);
            return { ok: true as const, url };
          } catch {
            return { ok: false as const };
          } finally {
            processed++;
            setUploadProgress(Math.round((processed / queue.length) * 100));
          }
        })
      );

      for (const result of batchResults) {
        if (result.ok) {
          uploaded.push(result.url);
        } else {
          failures++;
        }
      }
    }

    setImagePool((prev) => fillFirstEmptySlots(prev, uploaded, totalPosts));
    setUploadingPool(false);

    if (uploaded.length > 0 && failures === 0) {
      onToast("success", `${uploaded.length} archivo(s) subidos en cola.`);
      return;
    }

    if (uploaded.length > 0 && failures > 0) {
      onToast("error", `${uploaded.length} subidos, ${failures} fallaron.`);
      return;
    }

    onToast("error", "No se pudo subir ningún archivo.");
  }

  async function scheduleIntelligent() {
    if (!startDate) {
      onToast("error", "Selecciona una fecha de inicio.");
      return;
    }

    if (imagePool.filter(Boolean).length < totalPosts) {
      onToast("error", `Debes cargar al menos ${totalPosts} imagen(es).`);
      return;
    }

    if (!sameCaptionForAll && captionsByPost.length < totalPosts) {
      onToast("error", "Completa los captions individuales o activa el caption global.");
      return;
    }

    const baseDate = new Date(`${startDate}T00:00:00`);
    const now = new Date();
    const cleanImages = imagePool.filter(Boolean);

    let ok = 0;
    let fail = 0;
    let mediaIndex = 0;

    setSubmitting(true);
    try {
      for (let day = 0; day < totalDays; day++) {
        const date = dayFromOffset(baseDate, day);
        for (let slot = 0; slot < postsPerDay; slot++) {
          const scheduledAt = asScheduledAt(date, timeSlots[slot]);
          const scheduledDate = new Date(scheduledAt);

          if (scheduledDate <= now) {
            fail++;
            continue;
          }

          const caption = sameCaptionForAll
            ? globalCaption
            : captionsByPost[day * postsPerDay + slot] || "";

          try {
            await api("/scheduled-posts", {
              method: "POST",
              body: {
                platform,
                type,
                caption: caption || undefined,
                media_urls: [cleanImages[mediaIndex]],
                scheduled_at: scheduledAt,
              },
            });
            ok++;
          } catch {
            fail++;
          }

          mediaIndex++;
        }
      }
    } finally {
      setSubmitting(false);
    }

    if (fail === 0) {
      onToast("success", `${ok} post(s) programados correctamente en modo inteligente.`);
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

  const canSubmitIntelligent =
    !submitting &&
    startDate &&
    totalDays > 0 &&
    postsPerDay > 0 &&
    timeSlots.length === postsPerDay &&
    timeSlots.every(Boolean) &&
    imagePool.filter(Boolean).length >= totalPosts;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setBulkMode("intelligent")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            bulkMode === "intelligent" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Inteligente
        </button>
        <button
          type="button"
          onClick={() => setBulkMode("manual")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            bulkMode === "manual" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Manual
        </button>
      </div>

      {bulkMode === "intelligent" ? (
        <Card title="Programador inteligente (por rango)">
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Define rango de días, cantidad diaria y horarios. Luego sube todas las imágenes y se programan automáticamente.
            </p>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-border bg-background/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium">Fecha inicio</label>
                    <DatePicker
                      selected={toDateOnly(startDate)}
                      onChange={(date: Date | null) => setStartDate(fromDateOnly(date))}
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      className="ui-control"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium">Días</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={totalDays}
                      onChange={(e) => setTotalDays(Math.min(Math.max(Number(e.target.value || 1), 1), 60))}
                      className="ui-control"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium">Posts por día</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={postsPerDay}
                      onChange={(e) => syncTimeSlots(Number(e.target.value || 1))}
                      className="ui-control"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium">Total a programar</label>
                    <div className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold">
                      {totalPosts} post(s)
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium">Plataforma</label>
                    <FancySelect
                      value={platform}
                      onChange={(next) => setPlatform(next as BulkItem["platform"])}
                      options={[
                        ...(igConnected ? [{ value: "instagram", label: "Instagram" }] : []),
                        ...(fbConnected ? [{ value: "facebook", label: "Facebook" }] : []),
                        ...(igConnected && fbConnected ? [{ value: "both", label: "Ambas" }] : []),
                      ] as Option<BulkItem["platform"]>[]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted font-medium">Tipo</label>
                    <FancySelect
                      value={type}
                      onChange={(next) => setType(next as Exclude<BulkItem["type"], "text">)}
                      options={[
                        { value: "photo", label: "Foto" },
                        { value: "reel", label: "Reel" },
                        { value: "carousel", label: "Carrusel" },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleSection("timing")}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-card/70 px-3 py-2 text-left"
                  >
                    <span className="text-xs text-muted font-medium">Horas por día</span>
                    <span className="text-xs text-muted">{openSections.timing ? "Ocultar" : "Mostrar"}</span>
                  </button>
                  {openSections.timing && (
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {timeSlots.map((slot, idx) => (
                        <DatePicker
                          key={idx}
                          selected={toTimeDate(slot)}
                          onChange={(date: Date | null) => updateTimeSlot(idx, fromTimeDate(date))}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Hora"
                          dateFormat="h:mm aa"
                          className="ui-control"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border bg-background/60 p-4">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("captions")}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-card/70 px-3 py-2 text-left"
                  >
                    <span className="text-xs text-muted font-medium">Descripciones</span>
                    <span className="text-xs text-muted">{openSections.captions ? "Ocultar" : "Mostrar"}</span>
                  </button>

                  {openSections.captions && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          id="same-caption"
                          type="checkbox"
                          checked={sameCaptionForAll}
                          onChange={(e) => setSameCaptionForAll(e.target.checked)}
                        />
                        <label htmlFor="same-caption" className="text-sm text-muted">
                          Usar la misma descripción para todos los posts
                        </label>
                      </div>

                      {sameCaptionForAll ? (
                        <textarea
                          placeholder="Descripción global (opcional)..."
                          value={globalCaption}
                          onChange={(e) => setGlobalCaption(e.target.value)}
                          rows={3}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
                        />
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => ensureCaptionSlots(totalPosts)}
                            className="text-xs px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground"
                          >
                            Preparar {totalPosts} descripciones
                          </button>
                          <div className="max-h-64 overflow-auto space-y-2 pr-1">
                            {Array.from({ length: totalPosts }).map((_, i) => (
                              <textarea
                                key={i}
                                placeholder={`Descripción post #${i + 1}`}
                                value={captionsByPost[i] || ""}
                                onChange={(e) => {
                                  const next = [...captionsByPost];
                                  next[i] = e.target.value;
                                  setCaptionsByPost(next);
                                }}
                                rows={2}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleSection("uploads")}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-card/70 px-3 py-2 text-left"
                  >
                    <span className="text-xs text-muted font-medium">
                      Carga de archivos ({imagePool.filter(Boolean).length}/{totalPosts})
                    </span>
                    <span className="text-xs text-muted">{openSections.uploads ? "Ocultar" : "Mostrar"}</span>
                  </button>

                  {openSections.uploads && (
                    <>
                      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
                        <button
                          type="button"
                          onClick={() => setUploadMode("massive")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            uploadMode === "massive" ? "bg-accent text-white" : "text-muted hover:text-foreground"
                          }`}
                        >
                          Subida masiva
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMode("individual")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            uploadMode === "individual" ? "bg-accent text-white" : "text-muted hover:text-foreground"
                          }`}
                        >
                          Subida individual
                        </button>
                      </div>

                      {uploadMode === "massive" ? (
                        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                          <p className="text-xs text-muted">
                            Selecciona múltiples archivos y el sistema los subirá en turnos de {UPLOAD_BATCH_SIZE} para evitar bloqueos.
                          </p>
                          <input
                            type="file"
                            multiple
                            accept={type === "reel" ? "video/*" : "image/*"}
                            onChange={(event) => {
                              void handleMassiveUpload(event.target.files);
                              event.target.value = "";
                            }}
                            className="w-full text-xs"
                          />
                          {uploadingPool ? (
                            <div className="space-y-1">
                              <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                                <div className="h-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <p className="text-xs text-muted">Subiendo en cola... {uploadProgress}%</p>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setImagePool([])}
                            className="text-xs px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground"
                          >
                            Limpiar selección
                          </button>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-auto space-y-3 pr-1">
                          {Array.from({ length: totalPosts }).map((_, i) => (
                            <div key={i} className="space-y-1">
                              <span className="text-xs text-muted">Imagen post #{i + 1}</span>
                              <ImageUpload
                                value={imagePool[i] || ""}
                                onChange={(url) => {
                                  const next = [...imagePool];
                                  next[i] = url;
                                  setImagePool(next);
                                }}
                                accept={type === "reel" ? "video/*" : "image/*"}
                                label={type === "reel" ? "video" : "imagen"}
                                accentColor="#e1306c"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={scheduleIntelligent}
              disabled={!canSubmitIntelligent}
              className="w-full py-3 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {submitting ? "Programando..." : `Programar ${totalPosts} post(s)`}
            </button>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted">
            Programa múltiples posts a la vez. Cada uno se publicará en la fecha y hora indicada.
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
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
                    <div className="space-y-1">
                      <label className="text-xs text-muted font-medium">Plataforma</label>
                      <FancySelect
                        value={item.platform}
                        onChange={(next) => updateItem(item.id, { platform: next as BulkItem["platform"] })}
                        options={[
                          ...(igConnected ? [{ value: "instagram", label: "Instagram" }] : []),
                          ...(fbConnected ? [{ value: "facebook", label: "Facebook" }] : []),
                          ...(igConnected && fbConnected ? [{ value: "both", label: "Ambas" }] : []),
                        ] as Option<BulkItem["platform"]>[]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted font-medium">Tipo</label>
                      <FancySelect
                        value={item.type}
                        onChange={(next) => updateItem(item.id, { type: next as BulkItem["type"] })}
                        options={[
                          { value: "photo", label: "Foto" },
                          { value: "reel", label: "Reel" },
                          { value: "carousel", label: "Carrusel" },
                          ...(item.platform !== "instagram" ? [{ value: "text", label: "Solo texto" }] : []),
                        ] as Option<BulkItem["type"]>[]}
                      />
                    </div>
                  </div>

                  {item.type !== "text" ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <ImageUpload
                        value={item.mediaUrls[0] || ""}
                        onChange={(u) => updateItem(item.id, { mediaUrls: [u] })}
                        accept={item.type === "reel" ? "video/*" : "image/*"}
                        label={item.type === "reel" ? "video" : "imagen"}
                        accentColor="#e1306c"
                      />
                      <div className="space-y-3">
                        <textarea
                          placeholder="Caption / mensaje..."
                          value={item.caption}
                          onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                          rows={2}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
                        />
                        <ScheduleInput
                          value={item.scheduledAt}
                          onChange={(v) => updateItem(item.id, { scheduledAt: v })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Caption / mensaje..."
                        value={item.caption}
                        onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                        rows={2}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
                      />
                      <ScheduleInput
                        value={item.scheduledAt}
                        onChange={(v) => updateItem(item.id, { scheduledAt: v })}
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}
