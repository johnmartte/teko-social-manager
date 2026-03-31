"use client";

import { useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Props = {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  accentColor?: string;
};

function getTokenHeaders(): Record<string, string> {
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

export default function ImageUpload({ value, onChange, accept = "image/*", label = "imagen", accentColor = "#e1306c" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: getTokenHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al subir");
      onChange(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
      setPreview(null);
      onChange("");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleUrlChange(url: string) {
    onChange(url);
    setPreview(url || null);
  }

  const isVideo = accept.includes("video");

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 rounded-lg transition-colors ${mode === "upload" ? "text-white" : "bg-background border border-border text-muted hover:text-foreground"}`}
          style={mode === "upload" ? { backgroundColor: accentColor } : {}}
        >
          Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 rounded-lg transition-colors ${mode === "url" ? "text-white" : "bg-background border border-border text-muted hover:text-foreground"}`}
          style={mode === "url" ? { backgroundColor: accentColor } : {}}
        >
          URL pública
        </button>
      </div>

      {mode === "url" ? (
        <input
          type="url"
          placeholder={`URL pública del ${label} (https://...)`}
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none"
          style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
        />
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative w-full border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-foreground/20 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleInputChange}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: "transparent" }} />
              <p className="text-xs text-muted">Subiendo...</p>
            </div>
          ) : preview ? (
            <div className="space-y-2">
              {isVideo ? (
                <video src={preview} className="max-h-40 mx-auto rounded-lg object-contain" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
              )}
              <p className="text-xs text-muted">Click para cambiar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-medium">Arrastra o haz click para subir</p>
              <p className="text-xs text-muted">
                {isVideo ? "MP4, MOV hasta 100MB" : "JPG, PNG, GIF, WebP hasta 100MB"}
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
