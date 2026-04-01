"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { MediaItem, FacebookPost, WorkspaceSocialMeta } from "@/lib/types";
import Card from "@/components/Card";

type Platform = "instagram" | "facebook";

const defaultMessages: WorkspaceSocialMeta["posts"]["messages"] = {
  title: "Mis posts",
  connect_account: "Conecta una cuenta para ver tus posts.",
  loading_posts: "Cargando posts...",
  empty_posts: "No hay posts publicados.",
  instagram_delete_confirm: "Eliminar este post de Instagram? Esta accion no se puede deshacer.",
  facebook_delete_confirm: "Eliminar este post de Facebook?",
  post_updated: "Post actualizado",
  post_deleted: "Post eliminado",
  update_error: "Error al editar",
  delete_error: "Error al eliminar",
  details_title: "Detalles del post",
  edit_title: "Editar post",
  save_changes: "Guardar cambios",
  view_on_instagram: "Ver en Instagram",
  instagram_caption_note: "Instagram no permite editar el caption de posts publicados.",
  no_text: "(Sin texto)",
  no_image: "Sin imagen",
  message_label: "Mensaje",
};

const defaultPlatforms: WorkspaceSocialMeta["posts"]["platforms"] = [
  { key: "instagram", label: "Instagram", color: "accent" },
  { key: "facebook", label: "Facebook", color: "fb" },
];

export default function PostsPage() {
  const { status } = useAuth();
  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;

  const defaultPlatform: Platform = igConnected ? "instagram" : "facebook";
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [messages, setMessages] = useState(defaultMessages);
  const [platformLabels, setPlatformLabels] = useState(defaultPlatforms);

  useEffect(() => {
    api<WorkspaceSocialMeta>("/workspace/social/meta")
      .then((d) => {
        if (d.posts?.messages) {
          setMessages({ ...defaultMessages, ...d.posts.messages });
        }
        if (d.posts?.platforms?.length) {
          setPlatformLabels(d.posts.platforms);
        }
      })
      .catch(() => {});
  }, []);

  const visiblePlatforms = platformLabels.filter((p) =>
    p.key === "instagram" ? igConnected : fbConnected
  );

  function tabClass(p: WorkspaceSocialMeta["posts"]["platforms"][number]): string {
    const active = platform === p.key;
    if (!active) {
      return "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors text-muted hover:text-foreground";
    }
    if (p.color === "fb") {
      return "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors bg-fb text-white";
    }
    return "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors bg-accent text-white";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{messages.title}</h1>
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {visiblePlatforms.map((p) => (
            <button
              key={p.key}
              onClick={() => setPlatform(p.key)}
              className={tabClass(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!igConnected && !fbConnected && (
        <p className="text-muted text-center py-12 text-sm">{messages.connect_account}</p>
      )}

      {platform === "instagram" && igConnected && <IGPosts messages={messages} />}
      {platform === "facebook" && fbConnected && <FBPosts messages={messages} />}
    </div>
  );
}

// ─── Instagram Grid ────────────────────────────────────────────────────────

function IGPosts({ messages }: { messages: WorkspaceSocialMeta["posts"]["messages"] }) {
  const [posts, setPosts] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    api<{ data: MediaItem[] }>("/instagram/media?limit=24")
      .then((d) => setPosts(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(messages.instagram_delete_confirm)) return;
    setDeleting(true);
    try {
      await api(`/instagram/comments/${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
      showToast(messages.post_deleted);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : messages.delete_error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Card><p className="text-muted text-sm text-center py-12">{messages.loading_posts}</p></Card>;
  }

  if (posts.length === 0) {
    return <Card><p className="text-muted text-sm text-center py-12">{messages.empty_posts}</p></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelected(post)}
            className="aspect-square rounded-2xl overflow-hidden bg-card border border-border relative group"
          >
            {post.media_url || post.thumbnail_url ? (
              <img
                src={post.thumbnail_url || post.media_url}
                alt={post.caption || ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted text-xs p-2 text-center">
                {post.caption || messages.no_image}
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              {post.like_count != null && (
                <span className="text-white text-xs font-semibold">♥ {post.like_count}</span>
              )}
              {post.comments_count != null && (
                <span className="text-white text-xs font-semibold">💬 {post.comments_count}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-3xl border border-border w-full max-w-lg space-y-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{messages.details_title}</h3>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
            </div>

            {(selected.media_url || selected.thumbnail_url) && (
              <img
                src={selected.thumbnail_url || selected.media_url}
                alt=""
                className="w-full rounded-2xl object-cover max-h-64"
              />
            )}

            {selected.caption && (
              <p className="text-sm whitespace-pre-wrap">{selected.caption}</p>
            )}

            <div className="flex gap-4 text-sm text-muted">
              {selected.like_count != null && <span>♥ {selected.like_count} likes</span>}
              {selected.comments_count != null && <span>💬 {selected.comments_count} comentarios</span>}
            </div>

            <p className="text-xs text-muted">
              {new Date(selected.timestamp).toLocaleString("es-ES")}
            </p>

            <div className="flex gap-3 pt-2">
              {selected.permalink && (
                <a
                  href={selected.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm text-center font-medium hover:bg-background transition-colors"
                >
                  {messages.view_on_instagram}
                </a>
              )}
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={deleting}
                className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-red-50 transition-colors"
              >
                {deleting ? "..." : "Eliminar"}
              </button>
            </div>

            <p className="text-[11px] text-muted text-center">
              {messages.instagram_caption_note}
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 bg-card border border-border">
          {toast}
        </div>
      )}
    </>
  );
}

// ─── Facebook Posts ────────────────────────────────────────────────────────

function FBPosts({ messages }: { messages: WorkspaceSocialMeta["posts"]["messages"] }) {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FacebookPost | null>(null);
  const [editMsg, setEditMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    api<{ data: FacebookPost[] }>("/facebook/page/posts?limit=20")
      .then((d) => setPosts(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  function openPost(post: FacebookPost) {
    setSelected(post);
    setEditMsg(post.message || "");
  }

  async function handleEdit() {
    if (!selected) return;
    setEditing(true);
    try {
      await api(`/facebook/posts/${selected.id}`, { method: "PATCH", body: { message: editMsg } });
      setPosts((prev) => prev.map((p) => p.id === selected.id ? { ...p, message: editMsg } : p));
      setSelected((prev) => prev ? { ...prev, message: editMsg } : null);
      showToast(messages.post_updated);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : messages.update_error);
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!selected || !confirm(messages.facebook_delete_confirm)) return;
    setDeleting(true);
    try {
      await api(`/facebook/posts/${selected.id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== selected.id));
      setSelected(null);
      showToast(messages.post_deleted);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : messages.delete_error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Card><p className="text-muted text-sm text-center py-12">{messages.loading_posts}</p></Card>;
  }

  if (posts.length === 0) {
    return <Card><p className="text-muted text-sm text-center py-12">{messages.empty_posts}</p></Card>;
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => openPost(post)}
            className="w-full flex gap-4 bg-card/95 border border-border rounded-2xl px-5 py-4 text-left hover:border-foreground/10 transition-colors"
          >
            {post.full_picture && (
              <img src={post.full_picture} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2">{post.message || post.story || messages.no_text}</p>
              <div className="flex gap-3 mt-2 text-xs text-muted">
                <span>♥ {post.likes?.summary?.total_count ?? 0}</span>
                <span>💬 {post.comments?.summary?.total_count ?? 0}</span>
                <span>{new Date(post.created_time).toLocaleDateString("es-ES")}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-3xl border border-border w-full max-w-lg space-y-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{messages.edit_title}</h3>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
            </div>

            {selected.full_picture && (
              <img src={selected.full_picture} alt="" className="w-full rounded-2xl object-cover max-h-48" />
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">{messages.message_label}</label>
              <textarea
                value={editMsg}
                onChange={(e) => setEditMsg(e.target.value)}
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-fb resize-none"
              />
            </div>

            <div className="flex gap-3">
              {selected.likes?.summary?.total_count != null && (
                <span className="text-xs text-muted">♥ {selected.likes.summary.total_count}</span>
              )}
              {selected.comments?.summary?.total_count != null && (
                <span className="text-xs text-muted">💬 {selected.comments.summary.total_count}</span>
              )}
              <span className="text-xs text-muted ml-auto">
                {new Date(selected.created_time).toLocaleString("es-ES")}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleEdit}
                disabled={editing || editMsg === selected.message}
                className="flex-1 py-2.5 bg-fb text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {editing ? "Guardando..." : messages.save_changes}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-red-50 transition-colors"
              >
                {deleting ? "..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 bg-card border border-border">
          {toast}
        </div>
      )}
    </>
  );
}
