"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

/* ── Types ──────────────────────────────────────────────────── */

type Participant = { username?: string; name?: string; id: string };

type Attachment = {
  mime_type?: string;
  size?: number;
  image_data?: { url: string; width: number; height: number };
  video_data?: { url: string };
  file_url?: string;
};

type MessageData = {
  id: string;
  created_time: string;
  from: { username?: string; name?: string; id: string };
  to?: { data: { username?: string; name?: string; id: string }[] };
  message?: string;
  attachments?: { data: Attachment[] };
};

type Conversation = {
  id: string;
  updated_time: string;
  participants?: { data: Participant[] };
  messages?: { data: MessageData[] };
};

type ConversationsResponse = {
  data?: Conversation[];
  error?: { message: string } | string;
};

type MessagesResponse = {
  messages?: { data: MessageData[] };
  error?: string;
};

/* ── Helpers ────────────────────────────────────────────────── */

function displayName(p: { username?: string; name?: string; id?: string }): string {
  return p.username || p.name || p.id || "Usuario";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function messageContent(msg: MessageData): { text: string; imageUrl?: string } {
  const text = msg.message || "";
  let imageUrl: string | undefined;

  if (msg.attachments?.data?.length) {
    const att = msg.attachments.data[0];
    if (att.image_data?.url) {
      imageUrl = att.image_data.url;
    } else if (att.video_data?.url) {
      return { text: text || "Video", imageUrl: undefined };
    } else if (att.file_url) {
      imageUrl = att.file_url;
    }
  }

  if (!text && imageUrl) return { text: "", imageUrl };
  if (!text && !imageUrl) return { text: "Contenido multimedia", imageUrl: undefined };
  return { text, imageUrl };
}

/* ── Component ──────────────────────────────────────────────── */

export default function InboxPage() {
  const { status } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myIgUserId = typeof window !== "undefined" ? localStorage.getItem("ig_user_id") : null;

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ConversationsResponse>("/instagram/conversations");
      if (data.error) {
        const errMsg = typeof data.error === "string" ? data.error : data.error.message;
        setError(errMsg);
        setConversations([]);
      } else {
        setConversations(data.data || []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status?.instagram.connected) {
      loadConversations();
    } else {
      setLoading(false);
    }
  }, [status, loadConversations]);

  const loadMessages = useCallback(async (convoId: string) => {
    setSelectedConvo(convoId);
    setMessagesLoading(true);
    try {
      const data = await api<MessagesResponse>(`/instagram/conversations/${convoId}/messages`);
      const msgs = data.messages?.data || [];
      setMessages([...msgs].reverse());
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConvo || sending) return;

    const convo = conversations.find((c) => c.id === selectedConvo);
    const otherParticipant = convo?.participants?.data?.find((p) => p.id !== myIgUserId);
    const lastMsg = messages.find((m) => m.from.id !== myIgUserId);
    const recipientId = otherParticipant?.id || lastMsg?.from.id;

    if (!recipientId) return;

    setSending(true);
    try {
      await api("/instagram/messages/send", {
        method: "POST",
        body: { recipient_id: recipientId, message: replyText.trim() },
      });
      setReplyText("");
      await loadMessages(selectedConvo);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvo);

  function convoName(convo: Conversation): string {
    if (convo.participants?.data) {
      const other = convo.participants.data.find((p) => p.id !== myIgUserId);
      if (other) return displayName(other);
    }
    const lastMsg = convo.messages?.data?.[0];
    if (lastMsg && lastMsg.from.id !== myIgUserId) return displayName(lastMsg.from);
    if (lastMsg?.to?.data?.[0]) return displayName(lastMsg.to.data[0]);
    return "Conversacion";
  }

  function convoPreview(convo: Conversation): string {
    const msg = convo.messages?.data?.[0];
    if (!msg) return "Sin mensajes";
    const { text } = messageContent(msg);
    if (text) return text;
    return "Imagen";
  }

  if (!status?.instagram.connected) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted">Conecta Instagram para ver tus mensajes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold">Inbox</h1>
        <p className="text-xs text-muted">Mensajes directos de Instagram</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Conversation list */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted">{conversations.length} conversaciones</span>
            <button
              onClick={loadConversations}
              className="text-xs text-accent hover:underline"
            >
              Actualizar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted text-center py-8 animate-pulse">Cargando...</p>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-xs text-red-400 mb-2">{error}</p>
                <button onClick={loadConversations} className="text-xs text-accent hover:underline">
                  Reintentar
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted">No hay conversaciones</p>
                <p className="text-xs text-muted/60 mt-1">Los DMs apareceran aqui cuando alguien te escriba.</p>
              </div>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => loadMessages(convo.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-white/5 transition-colors ${
                    selectedConvo === convo.id ? "bg-white/10 border-l-2 border-l-[#e1306c]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#833ab4] via-[#e1306c] to-[#f77737] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {convoName(convo)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">@{convoName(convo)}</span>
                        <span className="text-[10px] text-muted ml-2 shrink-0">{timeAgo(convo.updated_time)}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 truncate">{convoPreview(convo)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main - Message view */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedConvo ? (
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
                <button
                  onClick={() => setSelectedConvo(null)}
                  className="lg:hidden text-muted hover:text-foreground text-lg"
                >
                  &larr;
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#833ab4] via-[#e1306c] to-[#f77737] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(selectedConversation ? convoName(selectedConversation) : "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">@{selectedConversation ? convoName(selectedConversation) : ""}</p>
                  <p className="text-[10px] text-muted">Instagram DM</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messagesLoading ? (
                  <p className="text-sm text-muted text-center py-8 animate-pulse">Cargando mensajes...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">Sin mensajes visibles.</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.from.id === myIgUserId;
                    const { text, imageUrl } = messageContent(msg);
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? "bg-[#e1306c] text-white rounded-br-sm"
                              : "bg-white/10 text-foreground rounded-bl-sm"
                          }`}
                        >
                          {!isMe && (
                            <p className="text-[10px] font-medium mb-1 opacity-70">
                              @{displayName(msg.from)}
                            </p>
                          )}
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt="attachment"
                              className="rounded-lg max-w-full max-h-60 object-cover mb-1"
                            />
                          )}
                          {text && <p className="text-sm">{text}</p>}
                          {!text && !imageUrl && (
                            <p className="text-sm italic opacity-70">Contenido multimedia</p>
                          )}
                          <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-muted"}`}>
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
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-xl border border-border bg-background/80 text-sm px-4 py-2.5 outline-none focus:border-[#e1306c] transition-colors"
                    disabled={sending}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-2.5 rounded-xl bg-[#e1306c] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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
