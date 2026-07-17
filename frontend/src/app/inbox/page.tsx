"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

/* ── Types ──────────────────────────────────────────────────── */

type Conversation = {
  id: string;
  channel: "instagram" | "facebook";
  participant_id: string | null;
  participant_name: string;
  last_message: string;
  last_message_from: string;
  updated_time: string | null;
  unread_count?: number;
};

type Message = {
  id: string;
  message: string;
  from_id: string | null;
  from_name: string;
  created_time: string | null;
  attachments: { type: string; url: string | null }[];
};

type ConversationsResponse = { conversations: Conversation[] };
type MessagesResponse = { messages: Message[] };

/* ── Helpers ────────────────────────────────────────────────── */

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ── Component ──────────────────────────────────────────────── */

export default function InboxPage() {
  const { status } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "instagram" | "facebook">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connected = status?.instagram?.connected || status?.facebook?.connected;

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ConversationsResponse>("/messages/conversations");
      setConversations(data.conversations || []);
    } catch (e) {
      setError((e as Error).message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) {
      void loadConversations();
    } else {
      setLoading(false);
    }
  }, [connected, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => void loadConversations(), 30000);
    return () => clearInterval(interval);
  }, [connected, loadConversations]);

  async function openConversation(conv: Conversation) {
    setSelected(conv);
    setMessages([]);
    setMsgsLoading(true);
    setReplyText("");
    try {
      const data = await api<MessagesResponse>(
        `/messages/${conv.id}?channel=${conv.channel}`
      );
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setMsgsLoading(false);
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await api("/messages/send", {
        method: "POST",
        body: {
          conversation_id: selected.id,
          channel: selected.channel,
          recipient_id: selected.participant_id,
          message: replyText.trim(),
        },
      });
      setReplyText("");
      await openConversation(selected);
    } catch (e) {
      alert((e as Error).message || "Error enviando mensaje");
    } finally {
      setSending(false);
    }
  }

  const filtered = filter === "all"
    ? conversations
    : conversations.filter((c) => c.channel === filter);

  if (!connected) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted">Conecta Instagram o Facebook para ver tus mensajes.</p>
      </div>
    );
  }

  const channelColor = (ch: string) => ch === "instagram" ? "#e1306c" : "#1877f2";
  const channelGradient = (ch: string) =>
    ch === "instagram"
      ? "from-[#833ab4] via-[#e1306c] to-[#f77737]"
      : "from-[#1877f2] to-[#42a5f5]";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Inbox unificado</h1>
          <p className="text-xs text-muted">Mensajes de Instagram y Facebook en un solo lugar</p>
        </div>
        <div className="flex gap-1">
          {(["all", "instagram", "facebook"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] px-3 py-1.5 rounded-full transition-colors ${
                filter === f
                  ? "bg-accent text-white"
                  : "bg-white/5 text-muted hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Todos" : f === "instagram" ? "Instagram" : "Facebook"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-2 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Conversation list */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted">{filtered.length} conversaciones</span>
            <button onClick={() => void loadConversations()} className="text-xs text-accent hover:underline">
              Actualizar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted text-center py-8 animate-pulse">Cargando...</p>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted">No hay conversaciones</p>
                <p className="text-xs text-muted/60 mt-1">Los mensajes apareceran aqui.</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => void openConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-white/5 transition-colors ${
                    selected?.id === conv.id ? "bg-white/10" : ""
                  }`}
                  style={selected?.id === conv.id ? { borderLeftWidth: 2, borderLeftColor: channelColor(conv.channel) } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${channelGradient(conv.channel)} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">
                        {conv.participant_name[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{conv.participant_name}</span>
                        <span className="text-[10px] text-muted ml-2 shrink-0">{timeAgo(conv.updated_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${channelColor(conv.channel)}20`, color: channelColor(conv.channel) }}
                        >
                          {conv.channel === "instagram" ? "IG" : "FB"}
                        </span>
                        <p className="text-xs text-muted truncate">{conv.last_message}</p>
                      </div>
                    </div>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main - Message view */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <p className="text-sm text-muted">Selecciona una conversacion</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button onClick={() => setSelected(null)} className="lg:hidden text-muted hover:text-foreground text-lg">
                  &larr;
                </button>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${channelGradient(selected.channel)} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">
                    {selected.participant_name[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{selected.participant_name}</p>
                  <p className="text-[10px] text-muted">
                    {selected.channel === "instagram" ? "Instagram DM" : "Facebook Messenger"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgsLoading ? (
                  <p className="text-sm text-muted text-center py-8 animate-pulse">Cargando mensajes...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">Sin mensajes visibles.</p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.from_id !== selected.participant_id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isOwn
                              ? `text-white rounded-br-sm`
                              : "bg-white/10 text-foreground rounded-bl-sm"
                          }`}
                          style={isOwn ? { backgroundColor: channelColor(selected.channel) } : undefined}
                        >
                          {!isOwn && (
                            <p className="text-[10px] font-medium mb-1 opacity-70">
                              {msg.from_name}
                            </p>
                          )}
                          {msg.attachments.length > 0 &&
                            msg.attachments.map((att, i) =>
                              att.url ? (
                                <img
                                  key={i}
                                  src={att.url}
                                  alt="adjunto"
                                  className="rounded-lg max-w-full max-h-60 object-cover mb-1"
                                />
                              ) : null
                            )}
                          {msg.message && <p className="text-sm">{msg.message}</p>}
                          {!msg.message && msg.attachments.length === 0 && (
                            <p className="text-sm italic opacity-70">Contenido multimedia</p>
                          )}
                          <p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-muted"}`}>
                            {formatTime(msg.created_time)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="px-4 py-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendReply();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-xl border border-border bg-background/80 text-sm px-4 py-2.5 outline-none transition-colors"
                    style={{ ["--tw-ring-color" as string]: channelColor(selected.channel) }}
                    disabled={sending}
                  />
                  <button
                    onClick={() => void sendReply()}
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: channelColor(selected.channel) }}
                  >
                    {sending ? "..." : "Enviar"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
