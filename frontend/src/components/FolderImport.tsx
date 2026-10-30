"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FolderUp, Loader2 } from "lucide-react";
import { api, getApiBaseUrl, getTokenHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StorageUsage from "@/components/StorageUsage";
import { useToast } from "@/components/Toaster";

const MEDIA = /\.(png|jpe?g|webp|gif|mp4|mov)$/i;
const VIDEO = /\.(mp4|mov)$/i;
const MAX_SLIDES = 10; // límite de Instagram por carrusel
const PARALLEL_UPLOADS = 3;
const SKIPPED_BY_DEFAULT = /historia|variaci[oó]n/i; // no son posts de feed

type Row = {
  id: string;
  name: string;
  files: File[];
  type: "photo" | "reel" | "carousel";
  selected: boolean;
  state: "idle" | "uploading" | "done" | "error";
  error?: string;
  preview: string | null;
};

const byName = (a: File, b: File) => a.name.localeCompare(b.name, undefined, { numeric: true });

/** Cada carpeta con medios = un post (carrusel si tiene varios). Los sueltos en la raíz son un post cada uno. */
function buildRows(files: File[]): Row[] {
  const media = files.filter((f) => MEDIA.test(f.name));
  const dirOf = (f: File) => (f.webkitRelativePath || f.name).split("/").slice(0, -1);
  const hasSubfolders = media.some((f) => dirOf(f).length > 1);

  const groups = new Map<string, File[]>();
  for (const f of media) {
    const dir = dirOf(f);
    // Si eligieron directamente una carpeta de carrusel, toda ella es un solo post.
    const key = dir.length > 1 || !hasSubfolders ? dir.join("/") : `${dir.join("/")}/${f.name}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }

  const rows: Row[] = [];
  [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, list]) => {
      list.sort(byName);
      const label = (key.split("/").pop() ?? key).replace(/\.[^.]+$/, "");
      const chunks: File[][] = [];
      for (let i = 0; i < list.length; i += MAX_SLIDES) chunks.push(list.slice(i, i + MAX_SLIDES));
      chunks.forEach((chunk, i) => {
        const first = chunk[0];
        rows.push({
          id: `${key}#${i}`,
          name: chunks.length > 1 ? `${label} (parte ${i + 1})` : label,
          files: chunk,
          type: chunk.length > 1 ? "carousel" : VIDEO.test(first.name) ? "reel" : "photo",
          selected: !SKIPPED_BY_DEFAULT.test(key),
          state: "idle",
          preview: VIDEO.test(first.name) ? null : URL.createObjectURL(first),
        });
      });
    });
  return rows;
}

async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
    method: "POST",
    headers: { Accept: "application/json", ...getTokenHeaders() },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || data.message || "Error al subir el archivo");
  return data.url as string;
}

/** Sube en paralelo limitado y conserva el orden de las láminas. */
async function uploadAll(files: File[], onEach: () => void): Promise<string[]> {
  const urls: string[] = new Array(files.length);
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      urls[i] = await uploadFile(files[i]);
      onEach();
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, files.length) }, worker));
  return urls;
}

const TYPE_LABEL = { photo: "Foto", reel: "Reel", carousel: "Carrusel" } as const;

export default function FolderImport({ campaignId, onImported }: { campaignId: number | null; onImported: () => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const patch = (id: string, change: Partial<Row>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const next = buildRows(Array.from(e.target.files ?? []));
    e.target.value = ""; // permite volver a elegir la misma carpeta
    if (!next.length) {
      toast("error", "No encontré imágenes ni videos", "Elige una carpeta con archivos PNG, JPG, WEBP, GIF, MP4 o MOV.");
      return;
    }
    rows.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
    setRows(next);
    setOpen(true);
  }

  function close() {
    if (busy) return;
    rows.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
    setRows([]);
    setOpen(false);
  }

  async function run() {
    const queue = rows.filter((r) => r.selected && r.state !== "done");
    if (!queue.length) return;
    setBusy(true);
    setProgress({ done: 0, total: queue.reduce((n, r) => n + r.files.length, 0) });

    let created = 0;
    let failed = 0;
    for (const row of queue) {
      patch(row.id, { state: "uploading", error: undefined });
      try {
        const urls = await uploadAll(row.files, () => setProgress((p) => ({ ...p, done: p.done + 1 })));
        await api("/scheduled-posts", {
          method: "POST",
          body: { platform: "instagram", type: row.type, status: "draft", caption: "", media_urls: urls, campaign_id: campaignId },
        });
        patch(row.id, { state: "done" });
        created++;
      } catch (e) {
        patch(row.id, { state: "error", error: e instanceof Error ? e.message : "Error" });
        failed++;
      }
    }

    setBusy(false);
    if (created) onImported();
    if (failed) toast("error", `${failed} post(s) no se importaron`, `${created} importados. Pulsa "Reintentar" para repetir solo los que fallaron.`);
    else toast("success", `${created} post(s) importados como borrador`, "Ya están en tu feed.");
  }

  const selected = rows.filter((r) => r.selected && r.state !== "done");
  const pending = selected.length;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const hasFailed = rows.some((r) => r.state === "error");

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={pick}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} className="h-10 rounded-full px-4">
        <FolderUp className="size-4" />
        Importar carpeta
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar carpeta</DialogTitle>
            <DialogDescription>
              Cada carpeta se convierte en un borrador: carrusel si tiene varias imágenes. Revisa y desmarca lo que no quieras importar.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[45vh] space-y-1.5 overflow-y-auto pr-1">
            {rows.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-2.5">
                <input
                  type="checkbox"
                  checked={r.selected}
                  disabled={busy || r.state === "done"}
                  onChange={(e) => patch(r.id, { selected: e.target.checked })}
                />
                {r.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.preview} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="size-10 shrink-0 rounded-lg bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {TYPE_LABEL[r.type]} · {r.files.length} {r.files.length === 1 ? "archivo" : "láminas"}
                    {r.state === "error" && r.error ? ` · ${r.error}` : ""}
                  </p>
                </div>
                {r.state === "uploading" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                {r.state === "done" && <CheckCircle2 className="size-4 text-[#6fcf97]" />}
                {r.state === "error" && <AlertCircle className="size-4 text-[#f0716a]" />}
              </label>
            ))}
          </div>

          {busy && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Subiendo {progress.done} de {progress.total} archivos…
              </p>
            </div>
          )}

          <StorageUsage />

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Cerrar
            </Button>
            <Button onClick={() => void run()} disabled={busy || pending === 0}>
              {busy ? "Importando…" : hasFailed ? "Reintentar" : `Importar ${pending} post(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
