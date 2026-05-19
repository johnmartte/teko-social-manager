"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { api, formatNum } from "@/lib/api";
import type { InsightMetric } from "@/lib/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ── Types ──────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AudienceMetric = Record<string, any>;

type OnlineFollowersMetric = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: { value: any; end_time: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  total_value?: any;
};

/* ── Helpers ────────────────────────────────────────────────── */

const COLORS = [
  "#e1306c", "#405de6", "#5851db", "#833ab4", "#c13584",
  "#fd1d1d", "#f56040", "#f77737", "#fcaf45", "#ffdc80",
  "#00b894", "#0984e3", "#6c5ce7", "#fd79a8",
];

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/**
 * Parse gender/age data from either:
 * - Legacy format: { "M.25-34": 100, "F.18-24": 200 }
 * - v18+ format: total_value.breakdowns[].results[] with dimension_values ["age","gender"]
 */
function parseGenderAge(audienceData: AudienceMetric[]) {
  const ageGroups: Record<string, { male: number; female: number; unknown: number }> = {};
  let totalMale = 0;
  let totalFemale = 0;
  let totalUnknown = 0;

  for (const metric of audienceData) {
    // v18+ format: total_value.breakdowns
    if (metric.total_value?.breakdowns) {
      for (const bd of metric.total_value.breakdowns) {
        for (const result of bd.results || []) {
          const dims = result.dimension_values || [];
          const val = result.value || 0;
          // dims could be ["18-24", "M"] or ["M", "18-24"] depending on breakdown order
          let age = "", gender = "";
          for (const d of dims) {
            if (d === "M" || d === "F" || d === "U") gender = d;
            else age = d;
          }
          if (!age) continue;
          if (!ageGroups[age]) ageGroups[age] = { male: 0, female: 0, unknown: 0 };
          if (gender === "M") { ageGroups[age].male += val; totalMale += val; }
          else if (gender === "F") { ageGroups[age].female += val; totalFemale += val; }
          else { ageGroups[age].unknown += val; totalUnknown += val; }
        }
      }
    }
    // Legacy format: values[0].value = { "M.25-34": 100 }
    else if (metric.values?.[0]?.value && typeof metric.values[0].value === "object") {
      const raw = metric.values[0].value as Record<string, number>;
      for (const [key, val] of Object.entries(raw)) {
        const [gender, age] = key.split(".");
        if (!age) continue;
        if (!ageGroups[age]) ageGroups[age] = { male: 0, female: 0, unknown: 0 };
        if (gender === "M") { ageGroups[age].male += val; totalMale += val; }
        else if (gender === "F") { ageGroups[age].female += val; totalFemale += val; }
        else { ageGroups[age].unknown += val; totalUnknown += val; }
      }
    }
  }

  if (totalMale + totalFemale + totalUnknown === 0) return null;

  const ageData = Object.entries(ageGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([age, v]) => ({ age, male: v.male, female: v.female, unknown: v.unknown }));

  const total = totalMale + totalFemale + totalUnknown;
  const genderData = [
    { name: "Mujeres", value: totalFemale, pct: total ? Math.round((totalFemale / total) * 100) : 0 },
    { name: "Hombres", value: totalMale, pct: total ? Math.round((totalMale / total) * 100) : 0 },
  ];
  if (totalUnknown > 0) {
    genderData.push({ name: "Otro", value: totalUnknown, pct: total ? Math.round((totalUnknown / total) * 100) : 0 });
  }

  return { ageData, genderData, total };
}

/**
 * Parse location data from either legacy or v18+ format
 */
function parseLocations(audienceData: AudienceMetric[], limit = 10) {
  const locations: Record<string, number> = {};

  for (const metric of audienceData) {
    // v18+ format
    if (metric.total_value?.breakdowns) {
      for (const bd of metric.total_value.breakdowns) {
        for (const result of bd.results || []) {
          const name = (result.dimension_values || []).join(", ");
          locations[name] = (locations[name] || 0) + (result.value || 0);
        }
      }
    }
    // Legacy format
    else if (metric.values?.[0]?.value && typeof metric.values[0].value === "object") {
      const raw = metric.values[0].value as Record<string, number>;
      for (const [name, val] of Object.entries(raw)) {
        locations[name] = (locations[name] || 0) + val;
      }
    }
  }

  return Object.entries(locations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

function parseOnlineFollowers(data: OnlineFollowersMetric[]) {
  if (!data.length) return [];

  // v18+ format: total_value.breakdowns
  const metric = data[0];
  if (metric.total_value?.breakdowns) {
    const results = metric.total_value.breakdowns[0]?.results || [];
    return results
      .map((r: { dimension_values: string[]; value: number }) => ({
        hour: `${(r.dimension_values?.[0] || "0").padStart(2, "0")}:00`,
        followers: r.value,
      }))
      .sort((a: { hour: string }, b: { hour: string }) => a.hour.localeCompare(b.hour));
  }

  // Legacy format: values[].value = { "0": 100, "1": 200, ... }
  const latest = metric.values?.[metric.values.length - 1]?.value;
  if (!latest || typeof latest !== "object") return [];

  return Object.entries(latest as Record<string, number>)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([hour, count]) => ({
      hour: `${hour.padStart(2, "0")}:00`,
      followers: count,
    }));
}

const IG_LABELS: Record<string, string> = {
  reach: "Alcance",
  impressions: "Impresiones",
  follower_count: "Seguidores",
  profile_views: "Visitas al perfil",
  website_clicks: "Clics en sitio web",
  email_contacts: "Clics en email",
  phone_call_clicks: "Clics en telefono",
  get_directions_clicks: "Clics en direcciones",
  text_message_clicks: "Clics en mensajes",
  total_likes: "Likes totales",
  total_comments: "Comentarios totales",
  total_interactions: "Interacciones",
  posts_count: "Posts analizados",
};

const IG_COLORS: Record<string, string> = {
  reach: "#e1306c",
  impressions: "#405de6",
  follower_count: "#833ab4",
  profile_views: "#f56040",
  website_clicks: "#00b894",
  email_contacts: "#0984e3",
  phone_call_clicks: "#6c5ce7",
  get_directions_clicks: "#f77737",
  text_message_clicks: "#fd79a8",
  total_likes: "#ed4956",
  total_comments: "#0095f6",
  total_interactions: "#5851db",
  posts_count: "#00b894",
};

// Metrics where we show latest value instead of total
const CUMULATIVE_METRICS = new Set(["follower_count", "total_likes", "total_comments", "total_interactions", "posts_count"]);

/* ── Component ──────────────────────────────────────────────── */

export default function InsightsPage() {
  const { status } = useAuth();

  const [igInsights, setIgInsights] = useState<InsightMetric[]>([]);
  const [audience, setAudience] = useState<AudienceMetric[]>([]);
  const [onlineData, setOnlineData] = useState<OnlineFollowersMetric[]>([]);
  const [fbInsights, setFbInsights] = useState<InsightMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugErrors, setDebugErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!status) return;
    setLoading(true);
    const errors: string[] = [];
    const promises: Promise<void>[] = [];

    if (status.instagram.connected) {
      promises.push(
        api<{ data: InsightMetric[]; error?: string }>("/instagram/insights")
          .then((r) => {
            console.log("IG insights response:", JSON.stringify(r));
            setIgInsights(r.data || []);
            if (r.error) errors.push(`insights: ${r.error}`);
          })
          .catch((e) => { errors.push(`insights fetch: ${e.message}`); })
      );
      promises.push(
        api<{ data: AudienceMetric[] }>("/instagram/audience")
          .then((r) => {
            console.log("IG audience response:", JSON.stringify(r));
            setAudience((r.data || []) as AudienceMetric[]);
          })
          .catch((e) => { errors.push(`audience: ${e.message}`); })
      );
      promises.push(
        api<{ data: OnlineFollowersMetric[] }>("/instagram/online-followers")
          .then((r) => {
            console.log("IG online response:", JSON.stringify(r));
            setOnlineData((r.data || []) as OnlineFollowersMetric[]);
          })
          .catch((e) => { errors.push(`online: ${e.message}`); })
      );
    }

    if (status.facebook.connected) {
      promises.push(
        api<{ data: InsightMetric[] }>("/facebook/page/insights?period=day")
          .then((r) => {
            console.log("FB insights response:", JSON.stringify(r));
            setFbInsights(r.data || []);
          })
          .catch((e) => { errors.push(`fb insights: ${e.message}`); })
      );
    }

    Promise.all(promises).finally(() => {
      setDebugErrors(errors);
      setLoading(false);
    });
  }, [status]);

  /* ── Derived data ──────────────────────────────────── */

  // Build chart data dynamically for ALL metrics that have values
  const igChartMetrics = useMemo(() => {
    return igInsights
      .filter((m) => m.values && m.values.length > 0)
      .map((m) => ({
        name: m.name,
        label: IG_LABELS[m.name] || m.title || m.name,
        color: IG_COLORS[m.name] || "#e1306c",
        isCumulative: CUMULATIVE_METRICS.has(m.name),
        data: m.values.map((v) => ({
          date: shortDate(v.end_time),
          value: v.value,
        })),
        total: m.values.reduce((s, v) => s + v.value, 0),
        latest: m.values[m.values.length - 1]?.value ?? 0,
      }));
  }, [igInsights]);

  const genderAgeRaw = useMemo(() => {
    // Find gender/age data from either v18+ or legacy format
    const genderAgeMetrics = audience.filter((a) =>
      a.name === "audience_gender_age" ||
      a.name === "follower_demographics" ||
      a.name === "reached_audience_demographics" ||
      (a._breakdown === "age,gender")
    );
    if (!genderAgeMetrics.length) return null;
    return parseGenderAge(genderAgeMetrics);
  }, [audience]);

  const cityData = useMemo(() => {
    const cityMetrics = audience.filter((a) =>
      a.name === "audience_city" || a._breakdown === "city"
    );
    return parseLocations(cityMetrics);
  }, [audience]);

  const countryData = useMemo(() => {
    const countryMetrics = audience.filter((a) =>
      a.name === "audience_country" || a._breakdown === "country"
    );
    return parseLocations(countryMetrics);
  }, [audience]);

  const onlineFollowers = useMemo(() => parseOnlineFollowers(onlineData), [onlineData]);

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;

  if (!igConnected && !fbConnected) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted">Conecta una cuenta para ver estadisticas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted animate-pulse">Cargando estadisticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Estadisticas</h1>
        <p className="text-sm text-muted mt-1">Analisis detallado de tus redes sociales (ultimos 30 dias).</p>
      </div>

      {debugErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-xs font-bold text-red-400 mb-1">Debug - Errores API:</p>
          {debugErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-300">{e}</p>
          ))}
        </div>
      )}

      {/* ── Instagram ────────────────────────────────── */}
      {igConnected && (
        <>
          {/* Summary cards - show all available metrics */}
          {igChartMetrics.length > 0 && (
            <div className={`grid grid-cols-2 gap-4 ${igChartMetrics.length >= 4 ? "sm:grid-cols-4" : `sm:grid-cols-${Math.min(igChartMetrics.length, 4)}`}`}>
              {igChartMetrics.map((m) => (
                <SummaryCard
                  key={m.name}
                  label={m.label}
                  value={m.isCumulative ? m.latest : m.total}
                  color={m.color}
                />
              ))}
            </div>
          )}

          {/* Trend charts - 2 per row, only for metrics with multiple data points */}
          {igChartMetrics.filter((m) => m.data.length > 1).length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {igChartMetrics
                .filter((m) => m.data.length > 1)
                .map((m) => (
                  <Card key={m.name} title={m.label} color={m.color}>
                    <ChartArea data={m.data} color={m.color} label={m.label} />
                  </Card>
                ))}
            </div>
          )}

          {igChartMetrics.length === 0 && (
            <Card title="Instagram" color="#e1306c">
              <NoData />
            </Card>
          )}

          {/* Gender + Age demographics */}
          {genderAgeRaw && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Genero de la audiencia" color="#c13584">
                <div className="flex items-center justify-center gap-8 py-2">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderAgeRaw.genderData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          {genderAgeRaw.genderData.map((_, i) => (
                            <Cell key={i} fill={["#e1306c", "#405de6", "#999"][i]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {genderAgeRaw.genderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: ["#e1306c", "#405de6", "#999"][i] }}
                        />
                        <span className="text-sm font-medium">{g.pct}%</span>
                        <span className="text-xs text-muted">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="Edad de la audiencia" color="#5851db">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderAgeRaw.ageData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #eee)" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card, #fff)",
                          border: "1px solid var(--color-border, #eee)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="female" name="Mujeres" fill="#e1306c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="male" name="Hombres" fill="#405de6" radius={[4, 4, 0, 0]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Locations */}
          {(cityData.length > 0 || countryData.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {cityData.length > 0 && (
                <Card title="Principales ciudades" color="#00b894">
                  <div className="space-y-2">
                    {cityData.map((c, i) => {
                      const max = cityData[0].value;
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted w-5 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate">{c.name}</span>
                              <span className="text-xs text-muted ml-2">{formatNum(c.value)}</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(c.value / max) * 100}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
              {countryData.length > 0 && (
                <Card title="Principales paises" color="#0984e3">
                  <div className="space-y-2">
                    {countryData.map((c, i) => {
                      const max = countryData[0].value;
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted w-5 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate">{c.name}</span>
                              <span className="text-xs text-muted ml-2">{formatNum(c.value)}</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(c.value / max) * 100}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Online followers / activity hours */}
          {onlineFollowers.length > 0 && (
            <Card title="Actividad de seguidores por hora" color="#6c5ce7">
              <p className="text-xs text-muted mb-3">Cuando tus seguidores estan mas activos (hora local).</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={onlineFollowers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #eee)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} width={45} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card, #fff)",
                        border: "1px solid var(--color-border, #eee)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v) => [formatNum(v as number), "Seguidores activos"]}
                    />
                    <Bar dataKey="followers" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Facebook ─────────────────────────────────── */}
      {fbConnected && (
        <>
          <h2 className="text-lg font-bold mt-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1877f2]" />
            Facebook
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {fbInsights.map((m) => {
              const val = m.values?.[m.values.length - 1]?.value;
              return (
                <SummaryCard
                  key={m.name}
                  label={FB_LABELS[m.name] || m.title || m.name}
                  value={val}
                  color="#1877f2"
                />
              );
            })}
            {fbInsights.length === 0 && (
              <p className="col-span-5 text-sm text-muted text-center py-4">Sin datos disponibles.</p>
            )}
          </div>

          {/* Facebook trend charts */}
          {fbInsights.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {fbInsights.filter(m => m.values?.length > 1).slice(0, 4).map((m) => (
                <Card key={m.name} title={FB_LABELS[m.name] || m.title || m.name} color="#1877f2">
                  <ChartArea
                    data={m.values.map((v) => ({ date: shortDate(v.end_time), value: v.value }))}
                    color="#1877f2"
                  />
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

const FB_LABELS: Record<string, string> = {
  page_impressions: "Impresiones",
  page_reach: "Alcance",
  page_fans: "Fans",
  page_views_total: "Visitas a la pagina",
  page_post_engagements: "Interacciones",
};

function SummaryCard({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className="bg-card/95 rounded-2xl border border-border p-4 shadow-sm">
      <p className="text-2xl font-bold" style={{ color }}>
        {formatNum(value)}
      </p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

let chartIdCounter = 0;

function ChartArea({ data, color, label }: { data: { date: string; value: number }[]; color: string; label?: string }) {
  const gradId = `grad-${color.replace("#", "")}-${++chartIdCounter}`;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#999" }}
            interval={Math.max(0, Math.floor(data.length / 7) - 1)}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#999" }}
            width={50}
            tickFormatter={(v) => formatNum(v)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(30,30,35,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 13,
              color: "#fff",
              padding: "8px 14px",
            }}
            formatter={(v) => [Number(v).toLocaleString(), label || ""]}
            labelStyle={{ color: "#999", fontSize: 11, marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function NoData() {
  return <p className="text-sm text-muted text-center py-8">Sin datos disponibles para este periodo.</p>;
}
