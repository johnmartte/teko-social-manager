"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { MediaItem, IgComment, WorkspaceSocialMeta } from "@/lib/types";
import Card from "@/components/Card";

const defaultMessages: WorkspaceSocialMeta["comments"]["messages"] = {
  title: "Comentarios",
  connect_instagram: "Conecta Instagram para gestionar comentarios.",
  select_post_title: "Selecciona un post",
  loading_posts: "Cargando posts...",
  select_post_empty: "Selecciona un post para ver sus comentarios",
  loading_comments: "Cargando comentarios...",
  empty_comments: "Sin comentarios",
  reply_placeholder: "Escribe una respuesta...",
  reply: "Responder",
  hide: "Ocultar",
  delete: "Eliminar",
  send: "Enviar",
  no_caption: "(Sin caption)",
  comments_count_suffix: "comentarios",
  load_posts_error: "Error cargando posts",
  load_comments_error: "Error cargando comentarios",
  reply_error: "Error al responder",
  hide_error: "Error al ocultar",
  delete_error: "Error al eliminar",
};

export default function CommentsPage() {
  const { status } = useAuth();
  const igConnected = status?.instagram.connected;

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [comments, setComments] = useState<IgComment[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uiMessages, setUiMessages] = useState(defaultMessages);

  useEffect(() => {
    api<WorkspaceSocialMeta>("/workspace/social/meta")
      .then((d) => {
        if (d.comments?.messages) {
          setUiMessages({ ...defaultMessages, ...d.comments.messages });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!igConnected) return;
    setLoadingMedia(true);
    api<{ data: MediaItem[] }>("/instagram/media?limit=20")
      .then((d) => setMedia(d.data || []))
      .catch(() => setError(uiMessages.load_posts_error))
      .finally(() => setLoadingMedia(false));
  }, [igConnected, uiMessages.load_posts_error]);

  function selectMedia(item: MediaItem) {
    setSelectedMedia(item);
    setComments([]);
    setLoadingComments(true);
    setError(null);
    api<{ data: IgComment[] }>(`/instagram/media/${item.id}/comments`)
      .then((d) => setComments(d.data || []))
      .catch(() => setError(uiMessages.load_comments_error))
      .finally(() => setLoadingComments(false));
  }

  async function handleReply(commentId: string) {
    const text = replyText[commentId]?.trim();
    if (!text || !selectedMedia) return;
    setSubmitting(true);
    try {
      await api(`/instagram/media/${commentId}/comments/reply`, {
        method: "POST",
        body: { message: text },
      });
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      setReplyingTo(null);
      // Refresh comments
      const d = await api<{ data: IgComment[] }>(`/instagram/media/${selectedMedia.id}/comments`);
      setComments(d.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : uiMessages.reply_error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHide(commentId: string) {
    try {
      await api(`/instagram/comments/${commentId}/hide`, { method: "POST", body: { hide: true } });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : uiMessages.hide_error);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await api(`/instagram/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : uiMessages.delete_error);
    }
  }

  if (!igConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Comentarios</h1>
        <p className="text-muted text-center py-12">{uiMessages.connect_instagram}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{uiMessages.title}</h1>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Post selector */}
        <Card>
          <h2 className="text-sm font-semibold mb-3">{uiMessages.select_post_title}</h2>
          {loadingMedia ? (
            <div className="text-sm text-muted text-center py-8">{uiMessages.loading_posts}</div>
          ) : (
            <ul className="space-y-2 max-h-150 overflow-y-auto pr-1">
              {media.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => selectMedia(item)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      selectedMedia?.id === item.id
                        ? "bg-accent-light border border-accent/20"
                        : "hover:bg-card border border-transparent"
                    }`}
                  >
                    {(item.media_url || item.thumbnail_url) && (
                      <img
                        src={item.thumbnail_url || item.media_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted truncate">
                        {item.caption || uiMessages.no_caption}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {item.comments_count ?? 0} {uiMessages.comments_count_suffix}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Comments panel */}
        <Card>
          {!selectedMedia ? (
            <div className="text-center py-16 text-muted text-sm">
              {uiMessages.select_post_empty}
            </div>
          ) : loadingComments ? (
            <div className="text-center py-16 text-muted text-sm">{uiMessages.loading_comments}</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm">{uiMessages.empty_comments}</div>
          ) : (
            <ul className="space-y-4 max-h-150 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <li key={comment.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold">@{comment.username}</span>
                      <p className="text-sm mt-1">{comment.text}</p>
                      <p className="text-[11px] text-muted mt-1">
                        {new Date(comment.timestamp).toLocaleString("es-ES")}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border hover:bg-card transition-colors"
                      >
                        {uiMessages.reply}
                      </button>
                      <button
                        onClick={() => handleHide(comment.id)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border hover:bg-card transition-colors text-muted"
                      >
                        {uiMessages.hide}
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        {uiMessages.delete}
                      </button>
                    </div>
                  </div>

                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText[comment.id] || ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))
                        }
                        placeholder={uiMessages.reply_placeholder}
                        className="flex-1 text-sm bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-accent"
                        onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={submitting}
                        className="text-xs px-4 py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {uiMessages.send}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
