"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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

/* ── Time periods ──────────────────────────────────────────── */

const TIME_PERIODS = [
  { label: "7 dias", days: 7 },
  { label: "14 dias", days: 14 },
  { label: "28 dias", days: 28 },
] as const;

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

function parseGenderAge(audienceData: AudienceMetric[]) {
  const ageGroups: Record<string, { male: number; female: number; unknown: number }> = {};
  let totalMale = 0;
  let totalFemale = 0;
  let totalUnknown = 0;

  for (const metric of audienceData) {
    if (metric.total_value?.breakdowns) {
      for (const bd of metric.total_value.breakdowns) {
        for (const result of bd.results || []) {
          const dims = result.dimension_values || [];
          const val = result.value || 0;
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
    } else if (metric.values?.[0]?.value && typeof metric.values[0].value === "object") {
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

  const total = totalMale + totalFemale + totalUnknown;
  const ageData = Object.entries(ageGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([age, v]) => ({ age, male: v.male, female: v.female, unknown: v.unknown }));

  const genderData = [
    { name: "Mujeres", value: totalFemale, pct: total ? Math.round((totalFemale / total) * 100) : 0 },
    { name: "Hombres", value: totalMale, pct: total ? Math.round((totalMale / total) * 100) : 0 },
  ];
  if (totalUnknown > 0) {
    genderData.push({ name: "Otro", value: totalUnknown, pct: total ? Math.round((totalUnknown / total) * 100) : 0 });
  }

  return { ageData, genderData, total };
}

function parseLocations(audienceData: AudienceMetric[], limit = 10) {
  const locations: Record<string, number> = {};

  for (const metric of audienceData) {
    if (metric.total_value?.breakdowns) {
      for (const bd of metric.total_value.breakdowns) {
        for (const result of bd.results || []) {
          const name = (result.dimension_values || []).join(", ");
          locations[name] = (locations[name] || 0) + (result.value || 0);
        }
      }
    } else if (metric.values?.[0]?.value && typeof metric.values[0].value === "object") {
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
  follower_count: "Seguidores",
  profile_views: "Visitas al perfil",
  accounts_engaged: "Cuentas interactuadas",
  total_interactions: "Interacciones totales",
  likes: "Likes",
  comments: "Comentarios",
  shares: "Compartidos",
  saves: "Guardados",
  replies: "Respuestas",
  follows_and_unfollows: "Seguimientos",
  profile_links_taps: "Clics en enlaces",
  views: "Vistas",
  website_clicks: "Clics en sitio web",
  total_likes: "Likes (posts)",
  total_comments: "Comentarios (posts)",
  posts_count: "Posts analizados",
};

const IG_COLORS: Record<string, string> = {
  reach: "#e1306c",
  follower_count: "#833ab4",
  profile_views: "#f56040",
  accounts_engaged: "#405de6",
  total_interactions: "#5851db",
  likes: "#ed4956",
  comments: "#0095f6",
  shares: "#00b894",
  saves: "#fcaf45",
  replies: "#6c5ce7",
  follows_and_unfollows: "#c13584",
  profile_links_taps: "#f77737",
  views: "#0984e3",
  website_clicks: "#00b894",
  total_likes: "#ed4956",
  total_comments: "#0095f6",
  posts_count: "#00b894",
};

const CUMULATIVE_METRICS = new Set(["follower_count", "total_likes", "total_comments", "posts_count"]);

/* ── Component ──────────────────────────────────────────────── */

export default function InsightsPage() {
  const { status } = useAuth();

  const [igInsights, setIgInsights] = useState<InsightMetric[]>([]);
  const [audience, setAudience] = useState<AudienceMetric[]>([]);
  const [onlineData, setOnlineData] = useState<OnlineFollowersMetric[]>([]);
  const [fbInsights, setFbInsights] = useState<InsightMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(28);
  const [initialLoaded, setInitialLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [debugData, setDebugData] = useState<any>(null);

  // Initial load — fetch everything once
  useEffect(() => {
    if (!status || initialLoaded) return;
    setLoading(true);
    const promises: Promise<void>[] = [];

    if (status.instagram.connected) {
      promises.push(
        api<{ data: InsightMetric[] }>(`/instagram/insights?days=${selectedDays}`)
          .then((r) => setIgInsights(r.data || []))
          .catch(() => setIgInsights([]))
      );
      promises.push(
        api<{ data: AudienceMetric[] }>("/instagram/audience")
          .then((r) => setAudience((r.data || []) as AudienceMetric[]))
          .catch(() => setAudience([]))
      );
      promises.push(
        api<{ data: OnlineFollowersMetric[] }>("/instagram/online-followers")
          .then((r) => setOnlineData((r.data || []) as OnlineFollowersMetric[]))
          .catch(() => setOnlineData([]))
      );
    }

    if (status.facebook.connected) {
      promises.push(
        api<{ data: InsightMetric[] }>("/facebook/page/insights?period=day")
          .then((r) => setFbInsights(r.data || []))
          .catch(() => setFbInsights([]))
      );
    }

    Promise.all(promises).finally(() => {
      setLoading(false);
      setInitialLoaded(true);
    });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // When period changes (after initial load), only refetch insights
  const handlePeriodChange = useCallback((days: number) => {
    if (days === selectedDays) return;
    setSelectedDays(days);
    if (!status?.instagram.connected) return;
    setInsightsLoading(true);
    api<{ data: InsightMetric[] }>(`/instagram/insights?days=${days}`)
      .then((r) => setIgInsights(r.data || []))
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }, [status, selectedDays]);

  /* ── Derived data ──────────────────────────────────── */

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
    const genderAgeMetrics = audience.filter((a) =>
      a.name === "audience_gender_age" ||
      a.name === "follower_demographics" ||
      a.name === "reached_audience_demographics" ||
      a.name === "engaged_audience_demographics" ||
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

  // Whether we have real demographic data or not
  const hasGenderData = genderAgeRaw !== null && genderAgeRaw.total > 0;
  const hasCityData = cityData.length > 0;
  const hasCountryData = countryData.length > 0;
  const hasOnlineData = onlineFollowers.length > 0;

  // Placeholder empty age data for chart
  const emptyAgeData = [
    { age: "13-17", male: 0, female: 0, unknown: 0 },
    { age: "18-24", male: 0, female: 0, unknown: 0 },
    { age: "25-34", male: 0, female: 0, unknown: 0 },
    { age: "35-44", male: 0, female: 0, unknown: 0 },
    { age: "45-54", male: 0, female: 0, unknown: 0 },
    { age: "55-64", male: 0, female: 0, unknown: 0 },
    { age: "65+", male: 0, female: 0, unknown: 0 },
  ];
  const emptyGenderData = [
    { name: "Mujeres", value: 0, pct: 0 },
    { name: "Hombres", value: 0, pct: 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header + Time filter ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estadisticas</h1>
          <p className="text-sm text-muted mt-1">Analisis detallado de tus redes sociales.</p>
        </div>
        <div className="flex gap-1 bg-card/80 border border-border rounded-xl p-1">
          {TIME_PERIODS.map((tp) => (
            <button
              key={tp.days}
              onClick={() => handlePeriodChange(tp.days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedDays === tp.days
                  ? "bg-[#e1306c] text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Instagram ────────────────────────────────── */}
      {igConnected && (
        <>
          {insightsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="w-4 h-4 border-2 border-[#e1306c] border-t-transparent rounded-full animate-spin" />
              Actualizando...
            </div>
          )}

          {/* Summary cards */}
          {igChartMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

          {igChartMetrics.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {["Alcance", "Seguidores", "Visitas al perfil", "Interacciones"].map((label) => (
                <SummaryCard key={label} label={label} value={0} color="#e1306c" />
              ))}
            </div>
          )}

          {/* Trend charts */}
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

          {/* ── Demographics (always visible) ────────── */}
          <div className="flex items-center justify-between mt-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c13584]" />
              Audiencia
            </h2>
            <button
              onClick={() => {
                api<Record<string, unknown>>("/instagram/debug-audience")
                  .then((r) => setDebugData(r))
                  .catch((e) => setDebugData({ error: e.message }));
              }}
              className="text-[10px] text-muted/50 hover:text-muted border border-border/30 rounded px-2 py-0.5"
            >
              Diagnosticar
            </button>
          </div>

          {debugData && (
            <div className="bg-zinc-900 border border-border rounded-xl p-4 text-xs overflow-auto max-h-96">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-white">Diagnostico de audiencia</span>
                <button onClick={() => setDebugData(null)} className="text-muted hover:text-white">Cerrar</button>
              </div>
              <div className="mb-3 space-y-1">
                <p className="text-green-400 font-bold">Cuenta IG ID: <span className="text-white font-mono">{debugData.user_id}</span></p>
                <p className="text-green-400 font-bold">Perfil (raw):</p>
                <pre className="text-white/80 whitespace-pre-wrap text-[10px] bg-black/30 p-2 rounded">{JSON.stringify(debugData.profile, null, 2)}</pre>
              </div>
              {debugData.token_info && (
                <div className="mb-3">
                  <p className="text-purple-400 font-bold">Token info:</p>
                  <pre className="text-white/80 whitespace-pre-wrap text-[10px] bg-black/30 p-2 rounded">{JSON.stringify(debugData.token_info?.data ? { type: debugData.token_info.data.type, app_id: debugData.token_info.data.app_id, is_valid: debugData.token_info.data.is_valid, scopes: debugData.token_info.data.scopes, expires_at: debugData.token_info.data.expires_at } : debugData.token_info, null, 2)}</pre>
                </div>
              )}
              {debugData.permissions?.data && (
                <div className="mb-3">
                  <p className="text-blue-400 font-bold">Permisos del token:</p>
                  <p className="text-white text-[10px]">{debugData.permissions.data.filter((p: {status:string}) => p.status === "granted").map((p: {permission:string}) => p.permission).join(", ")}</p>
                  {debugData.permissions.data.filter((p: {status:string}) => p.status !== "granted").length > 0 && (
                    <p className="text-red-400 text-[10px]">Denegados: {debugData.permissions.data.filter((p: {status:string}) => p.status !== "granted").map((p: {permission:string, status:string}) => `${p.permission}(${p.status})`).join(", ")}</p>
                  )}
                </div>
              )}
              {debugData.demographic_tests && (
                <div>
                  <p className="text-yellow-400 font-bold mb-1">Tests de demographics:</p>
                  {debugData.demographic_tests.map((t: Record<string, unknown>, i: number) => (
                    <div key={i} className={`py-1 border-b border-border/20 ${(t.has_data as boolean) ? "text-green-400" : "text-red-400"}`}>
                      <span className="font-mono">{(t.params as Record<string,string>).metric}({(t.params as Record<string,string>).breakdown}) [{(t.params as Record<string,string>).timeframe || "no-timeframe"}]</span>
                      <span className="ml-2">{(t.has_data as boolean) ? "OK - tiene datos" : `Sin datos (${(t.response as Record<string,{message:string}>)?.error?.message || "empty"})`}</span>
                    </div>
                  ))}
                </div>
              )}
              {debugData.error && <p className="text-red-400">{debugData.error}</p>}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gender */}
            <Card title="Genero de la audiencia" color="#c13584">
              {hasGenderData ? (
                <div className="flex items-center justify-center gap-8 py-2">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderAgeRaw!.genderData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          {genderAgeRaw!.genderData.map((_, i) => (
                            <Cell key={i} fill={["#e1306c", "#405de6", "#999"][i]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {genderAgeRaw!.genderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ["#e1306c", "#405de6", "#999"][i] }} />
                        <span className="text-sm font-medium">{g.pct}%</span>
                        <span className="text-xs text-muted">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-8 py-2">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={emptyGenderData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                          <Cell fill="#333" />
                          <Cell fill="#444" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {emptyGenderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ["#e1306c", "#405de6"][i] }} />
                        <span className="text-sm font-medium">0%</span>
                        <span className="text-xs text-muted">{g.name}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted/60 mt-1">Sin datos suficientes</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Age */}
            <Card title="Edad de la audiencia" color="#5851db">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hasGenderData ? genderAgeRaw!.ageData : emptyAgeData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #eee)" />
                    <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(30,30,35,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="female" name="Mujeres" fill="#e1306c" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="male" name="Hombres" fill="#405de6" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {!hasGenderData && <p className="text-[10px] text-muted/60 text-center">Sin datos suficientes</p>}
            </Card>
          </div>

          {/* Locations (always visible) */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Principales ciudades" color="#00b894">
              {hasCityData ? (
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
                              style={{ width: `${(c.value / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState label="No hay datos de ciudades disponibles" />
              )}
            </Card>
            <Card title="Principales paises" color="#0984e3">
              {hasCountryData ? (
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
                              style={{ width: `${(c.value / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState label="No hay datos de paises disponibles" />
              )}
            </Card>
          </div>

          {/* Online followers (always visible) */}
          <Card title="Actividad de seguidores por hora" color="#6c5ce7">
            <p className="text-xs text-muted mb-3">Cuando tus seguidores estan mas activos (hora local).</p>
            {hasOnlineData ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={onlineFollowers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #eee)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} width={45} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(30,30,35,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "#fff",
                      }}
                      formatter={(v) => [formatNum(v as number), "Seguidores activos"]}
                    />
                    <Bar dataKey="followers" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState label="No hay datos de actividad disponibles" />
            )}
          </Card>
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
        {formatNum(value ?? 0)}
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
        <span className="text-lg text-muted/40">0</span>
      </div>
      <p className="text-xs text-muted/60">{label}</p>
    </div>
  );
}
