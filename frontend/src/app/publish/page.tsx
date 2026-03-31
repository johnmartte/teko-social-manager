"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { api } from "@/lib/api";

type Tab = "ig-photo" | "ig-reel" | "ig-carousel" | "fb-post" | "fb-photo";

export default function PublishPage() {
  const { status } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("ig-photo");
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

  const tabs: { id: Tab; label: string; platform: "ig" | "fb" }[] = [
    { id: "ig-photo", label: "IG Foto", platform: "ig" },
    { id: "ig-reel", label: "IG Reel", platform: "ig" },
    { id: "ig-carousel", label: "IG Carrusel", platform: "ig" },
    { id: "fb-post", label: "FB Texto", platform: "fb" },
    { id: "fb-photo", label: "FB Foto", platform: "fb" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Publicar</h1>

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
      {activeTab === "ig-photo" && <IGPhotoForm onSubmit={handleSubmit} submitting={submitting} />}
      {activeTab === "ig-reel" && <IGReelForm onSubmit={handleSubmit} submitting={submitting} />}
      {activeTab === "ig-carousel" && <IGCarouselForm onSubmit={handleSubmit} submitting={submitting} />}
      {activeTab === "fb-post" && <FBPostForm onSubmit={handleSubmit} submitting={submitting} />}
      {activeTab === "fb-photo" && <FBPhotoForm onSubmit={handleSubmit} submitting={submitting} />}

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

type FormProps = {
  onSubmit: (path: string, body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
};

function IGPhotoForm({ onSubmit, submitting }: FormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <Card title="Publicar foto en Instagram" color="#e1306c">
      <div className="space-y-3">
        <input type="url" placeholder="URL pública de la imagen (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent" />
        <textarea placeholder="Pie de foto (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none" />
        <button disabled={!url || submitting} onClick={() => onSubmit("/instagram/publish/photo", { image_url: url, caption })} className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
          {submitting ? "Publicando..." : "Publicar foto"}
        </button>
      </div>
    </Card>
  );
}

function IGReelForm({ onSubmit, submitting }: FormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <Card title="Publicar Reel en Instagram" color="#f5a623">
      <div className="space-y-3">
        <input type="url" placeholder="URL pública del video .mp4 (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-warning" />
        <textarea placeholder="Descripción (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-warning resize-none" />
        <button disabled={!url || submitting} onClick={() => onSubmit("/instagram/publish/reel", { video_url: url, caption })} className="bg-warning text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
          {submitting ? "Publicando..." : "Publicar Reel"}
        </button>
      </div>
    </Card>
  );
}

function IGCarouselForm({ onSubmit, submitting }: FormProps) {
  const [urls, setUrls] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <Card title="Publicar carrusel en Instagram" color="#7c3aed">
      <div className="space-y-3">
        <p className="text-xs text-muted">Una URL por línea (mínimo 2, máximo 10)</p>
        <textarea placeholder={"https://imagen1.jpg\nhttps://imagen2.jpg\nhttps://imagen3.jpg"} value={urls} onChange={(e) => setUrls(e.target.value)} rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7c3aed] resize-none font-mono" />
        <textarea placeholder="Descripción del carrusel (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7c3aed] resize-none" />
        <button
          disabled={submitting}
          onClick={() => {
            const imageUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
            if (imageUrls.length < 2) return alert("Necesitas al menos 2 URLs.");
            onSubmit("/instagram/publish/carousel", { image_urls: imageUrls, caption });
          }}
          className="bg-[#7c3aed] text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "Publicando..." : "Publicar carrusel"}
        </button>
      </div>
    </Card>
  );
}

function FBPostForm({ onSubmit, submitting }: FormProps) {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  return (
    <Card title="Publicar en Facebook" color="#1877f2">
      <div className="space-y-3">
        <textarea placeholder="¿Qué quieres publicar?" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none" />
        <input type="url" placeholder="Enlace (opcional)" value={link} onChange={(e) => setLink(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb" />
        <button disabled={!message || submitting} onClick={() => onSubmit("/facebook/page/publish", { message, link: link || undefined })} className="bg-fb text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
          {submitting ? "Publicando..." : "Publicar en Facebook"}
        </button>
      </div>
    </Card>
  );
}

function FBPhotoForm({ onSubmit, submitting }: FormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <Card title="Publicar foto en Facebook" color="#1877f2">
      <div className="space-y-3">
        <input type="url" placeholder="URL pública de la imagen (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb" />
        <textarea placeholder="Descripción (opcional)..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none" />
        <button disabled={!url || submitting} onClick={() => onSubmit("/facebook/page/publish/photo", { image_url: url, caption })} className="bg-fb text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
          {submitting ? "Publicando..." : "Publicar foto"}
        </button>
      </div>
    </Card>
  );
}
