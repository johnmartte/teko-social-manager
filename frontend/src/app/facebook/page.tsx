"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import CustomSelect from "@/components/CustomSelect";
import { api, formatNum } from "@/lib/api";
import type { FacebookPage, FacebookPost, InsightMetric } from "@/lib/types";

export default function FacebookPageView() {
  const { status, loading } = useAuth();
  const [page, setPage] = useState<FacebookPage | null>(null);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [period, setPeriod] = useState("day");

  useEffect(() => {
    if (!status?.facebook.connected) return;
    api<FacebookPage>("/facebook/page").then(setPage).catch(() => {});
    api<{ data: FacebookPost[] }>("/facebook/page/posts?limit=10")
      .then((r) => setPosts(r.data || []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (!status?.facebook.connected) return;
    api<{ data: InsightMetric[] }>(`/facebook/page/insights?period=${period}`)
      .then((r) => setInsights(r.data || []))
      .catch(() => {});
  }, [status, period]);

  if (loading) return <div className="animate-pulse h-96 bg-border rounded-2xl" />;
  if (!status?.facebook.connected) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">Conecta tu cuenta de Facebook primero.</p>
      </div>
    );
  }

  const metricLabels: Record<string, string> = {
    page_impressions: "Impresiones",
    page_reach: "Alcance",
    page_fans: "Fans",
    page_views_total: "Visitas",
    page_post_engagements: "Engagement",
  };

  async function handleDelete(postId: string) {
    if (!confirm("¿Eliminar esta publicación?")) return;
    try {
      await api(`/facebook/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      alert("Error al eliminar.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Facebook</h1>

      {/* Page info */}
      {page && (
        <Card>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fb to-[#42b0ff] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {page.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold">{page.name}</p>
              <p className="text-xs text-muted">ID: {page.id}</p>
              {page.about && <p className="text-xs text-muted mt-1">{page.about}</p>}
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-xl font-bold">{formatNum(page.fan_count)}</p>
                <p className="text-xs text-muted">Me gusta</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatNum(page.followers_count)}</p>
                <p className="text-xs text-muted">Seguidores</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Insights */}
      <Card
        title="Estadísticas"
        action={
          <CustomSelect
            value={period}
            onChange={setPeriod}
            options={[
              { value: "day", label: "Hoy" },
              { value: "week", label: "Semana" },
              { value: "month", label: "Mes" },
            ]}
          />
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {insights.map((m) => {
            const val = m.values?.[m.values.length - 1]?.value;
            return (
              <div key={m.name} className="bg-background rounded-xl p-4 text-center">
                <p className="text-xl font-bold">{formatNum(val)}</p>
                <p className="text-xs text-muted mt-0.5">{metricLabels[m.name] || m.name}</p>
              </div>
            );
          })}
          {insights.length === 0 && (
            <p className="col-span-5 text-center text-sm text-muted py-4">Sin datos disponibles.</p>
          )}
        </div>
      </Card>

      {/* Posts */}
      <Card title="Posts recientes">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-muted py-8">No hay publicaciones.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const msg = post.message || post.story || "Sin texto";
              const date = new Date(post.created_time).toLocaleDateString("es", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const likes = post.likes?.summary?.total_count ?? 0;
              const comments = post.comments?.summary?.total_count ?? 0;
              return (
                <div key={post.id} className="flex gap-4 bg-background rounded-xl p-4">
                  {post.full_picture && (
                    <img
                      src={post.full_picture}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{msg}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted">
                      <span>❤️ {formatNum(likes)}</span>
                      <span>💬 {formatNum(comments)}</span>
                      <span>{date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors self-start"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
