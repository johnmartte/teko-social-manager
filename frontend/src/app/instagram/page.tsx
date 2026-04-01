"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import CustomSelect from "@/components/CustomSelect";
import { api, formatNum } from "@/lib/api";
import type { InstagramProfile, MediaItem, InsightMetric } from "@/lib/types";

export default function InstagramPage() {
  const { status, loading } = useAuth();
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [period, setPeriod] = useState("day");

  useEffect(() => {
    if (!status?.instagram.connected) return;
    api<InstagramProfile>("/instagram/profile").then(setProfile).catch(() => {});
    api<{ data: MediaItem[] }>("/instagram/media?limit=12")
      .then((r) => setMedia(r.data || []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (!status?.instagram.connected) return;
    api<{ data: InsightMetric[] }>(`/instagram/insights?period=${period}`)
      .then((r) => setInsights(r.data || []))
      .catch(() => {});
  }, [status, period]);

  if (loading) return <div className="animate-pulse h-96 bg-border rounded-2xl" />;
  if (!status?.instagram.connected) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">Conecta tu cuenta de Instagram primero.</p>
      </div>
    );
  }

  const metricLabels: Record<string, string> = {
    impressions: "Impresiones",
    reach: "Alcance",
    profile_views: "Visitas al perfil",
    follower_count: "Seguidores",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Instagram</h1>

      {/* Profile */}
      {profile && (
        <Card>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-[#fcaf45] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {profile.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold">{profile.name || profile.username}</p>
              <p className="text-sm text-muted">@{profile.username}</p>
              {profile.biography && <p className="text-xs text-muted mt-1">{profile.biography}</p>}
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-xl font-bold">{formatNum(profile.followers_count)}</p>
                <p className="text-xs text-muted">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatNum(profile.media_count)}</p>
                <p className="text-xs text-muted">Posts</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <p className="col-span-4 text-center text-sm text-muted py-4">Sin datos disponibles.</p>
          )}
        </div>
      </Card>

      {/* Feed */}
      <Card title="Feed reciente">
        {media.length === 0 ? (
          <p className="text-center text-sm text-muted py-8">No hay publicaciones.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {media.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-background group cursor-pointer">
                {(item.thumbnail_url || item.media_url) && (
                  <img
                    src={item.thumbnail_url || item.media_url}
                    alt={item.caption || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute top-1.5 right-1.5 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                  {{ IMAGE: "IMG", VIDEO: "VID", CAROUSEL_ALBUM: "CAR" }[item.media_type] || ""}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-medium">
                  <span>❤️ {formatNum(item.like_count)}</span>
                  <span>💬 {formatNum(item.comments_count)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
