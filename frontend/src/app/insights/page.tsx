"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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

/* Paleta categórica desaturada: misma saturación y luminosidad para que
   ninguna serie domine visualmente. Legible en claro y oscuro. */
const COLORS = [
  "#6b93bf", "#7fa87f", "#c49a4a", "#bf7a9c",
  "#8a86bf", "#5fa3a3", "#bf8f6b", "#9a9a9a",
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
  reach: "var(--ig)",
  follower_count: "var(--ig)",
  profile_views: "var(--warning)",
  accounts_engaged: "var(--fb)",
  total_interactions: "var(--fb)",
  likes: "var(--error)",
  comments: "var(--fb)",
  shares: "var(--fb)",
  saves: "var(--warning)",
  replies: "var(--fb)",
  follows_and_unfollows: "var(--ig)",
  profile_links_taps: "var(--warning)",
  views: "var(--fb)",
  website_clicks: "var(--fb)",
  total_likes: "var(--error)",
  total_comments: "var(--fb)",
  posts_count: "var(--fb)",
};

const CUMULATIVE_METRICS = new Set(["follower_count", "total_likes", "total_comments", "posts_count"]);

/* ── Component ──────────────────────────────────────────────── */

export default function InsightsPage() {
  const { status } = useAuth();
  const { isDark } = useTheme();
  const chartTheme = {
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(16,24,40,0.08)",
    axis: isDark ? "rgba(242,243,245,0.55)" : "var(--muted-foreground)",
    tooltipBg: isDark ? "rgba(8,10,15,0.95)" : "rgba(255,255,255,0.97)",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(16,24,40,0.08)",
    tooltipText: isDark ? "var(--foreground)" : "var(--foreground)",
  };

  const [igInsights, setIgInsights] = useState<InsightMetric[]>([]);
  const [audience, setAudience] = useState<AudienceMetric[]>([]);
  const [onlineData, setOnlineData] = useState<OnlineFollowersMetric[]>([]);
  const [fbInsights, setFbInsights] = useState<InsightMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(28);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [igFollowers, setIgFollowers] = useState<number | null>(null);
  const [igProfile, setIgProfile] = useState<{ username?: string; profile_picture_url?: string; name?: string } | null>(null);
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
        api<{ followers_count?: number; username?: string; profile_picture_url?: string; name?: string }>("/instagram/profile")
          .then((r) => {
            setIgFollowers(r.followers_count ?? null);
            setIgProfile(r);
          })
          .catch(() => {})
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
        color: IG_COLORS[m.name] || "var(--ig)",
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
        <p className="text-muted-foreground">Conecta una cuenta para ver estadisticas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground animate-pulse">Cargando estadisticas...</p>
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
          <h1 className="text-2xl font-semibold">Estadisticas</h1>
          <p className="text-sm text-muted-foreground mt-1">Analisis detallado de tus redes sociales.</p>
        </div>
        <div className="flex gap-1 bg-card/80 border border-border rounded-xl p-1">
          {TIME_PERIODS.map((tp) => (
            <button
              key={tp.days}
              onClick={() => handlePeriodChange(tp.days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedDays === tp.days
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
          {/* Profile header */}
          {igProfile && (
            <div className="flex items-center gap-4 bg-card/95 rounded-lg border border-border p-4 shadow-sm">
              {igProfile.profile_picture_url ? (
                <img
                  src={igProfile.profile_picture_url}
                  alt={igProfile.username || ""}
                  className="w-14 h-14 rounded-full border-2 border-[var(--ig)] object-cover"
                />
              ) : (
                <div className="size-14 rounded-full border border-border bg-muted flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">{(igProfile.username || "?")[0].toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">{igProfile.name || igProfile.username}</p>
                <p className="text-sm text-muted-foreground">@{igProfile.username}</p>
              </div>
              {igFollowers !== null && (
                <div className="ml-auto text-right">
                  <p className="text-2xl font-semibold" style={{ color: "var(--ig)" }}>{formatNum(igFollowers)}</p>
                  <p className="text-xs text-muted-foreground">seguidores</p>
                </div>
              )}
            </div>
          )}

          {insightsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 border-2 border-[var(--ig)] border-t-transparent rounded-full animate-spin" />
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
                <SummaryCard key={label} label={label} value={0} color="var(--ig)" />
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
                    <ChartArea data={m.data} color={m.color} label={m.label} theme={chartTheme} />
                  </Card>
                ))}
            </div>
          )}

          {/* ── Demographics (always visible) ────────── */}
          <h2 className="text-lg font-semibold mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ig)]" />
            Audiencia
          </h2>

          {/* Info banner when not enough followers */}
          {!hasGenderData && igFollowers !== null && igFollowers < 100 && (
            <div className="bg-warning-light/40 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-warning text-lg mt-0.5">&#9888;</span>
              <div>
                <p className="text-sm font-medium text-warning">Se necesitan 100+ seguidores para datos demograficos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu cuenta tiene <span className="font-semibold text-foreground">{igFollowers}</span> seguidores.
                  Meta requiere un minimo de 100 seguidores para mostrar datos de genero, edad, ciudades y paises.
                  Te faltan <span className="font-semibold text-warning">{100 - igFollowers}</span> seguidores.
                </p>
                <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden w-48">
                  <div
                    className="h-full bg-warning rounded-full transition-all"
                    style={{ width: `${Math.min(100, (igFollowers / 100) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{igFollowers}/100 seguidores</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gender */}
            <Card title="Genero de la audiencia" color="var(--ig)">
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
                            <Cell key={i} fill={["var(--ig)", "var(--fb)", "#999"][i]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {genderAgeRaw!.genderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ["var(--ig)", "var(--fb)", "#999"][i] }} />
                        <span className="text-sm font-medium">{g.pct}%</span>
                        <span className="text-xs text-muted-foreground">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState label="Disponible con 100+ seguidores" />
              )}
            </Card>

            {/* Age */}
            <Card title="Edad de la audiencia" color="var(--fb)">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hasGenderData ? genderAgeRaw!.ageData : emptyAgeData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="age" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} width={40} />
                    <Tooltip
                      contentStyle={{
                        background: chartTheme.tooltipBg,
                        border: `1px solid ${chartTheme.tooltipBorder}`,
                        borderRadius: 12,
                        fontSize: 12,
                        color: chartTheme.tooltipText,
                      }}
                    />
                    <Bar dataKey="female" name="Mujeres" fill="var(--ig)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="male" name="Hombres" fill="var(--fb)" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {!hasGenderData && <p className="text-[10px] text-muted-foreground/60 text-center">Disponible con 100+ seguidores</p>}
            </Card>
          </div>

          {/* Locations (always visible) */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Principales ciudades" color="var(--fb)">
              {hasCityData ? (
                <div className="space-y-2">
                  {cityData.map((c, i) => {
                    const max = cityData[0].value;
                    return (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{c.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{formatNum(c.value)}</span>
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
                <EmptyState label="Disponible con 100+ seguidores" />
              )}
            </Card>
            <Card title="Principales paises" color="var(--fb)">
              {hasCountryData ? (
                <div className="space-y-2">
                  {countryData.map((c, i) => {
                    const max = countryData[0].value;
                    return (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{c.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{formatNum(c.value)}</span>
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
                <EmptyState label="Disponible con 100+ seguidores" />
              )}
            </Card>
          </div>

          {/* Online followers (always visible) */}
          <Card title="Actividad de seguidores por hora" color="var(--fb)">
            <p className="text-xs text-muted-foreground mb-3">Cuando tus seguidores estan mas activos (hora local).</p>
            {hasOnlineData ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={onlineFollowers}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: chartTheme.axis }} interval={1} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} width={45} />
                    <Tooltip
                      contentStyle={{
                        background: chartTheme.tooltipBg,
                        border: `1px solid ${chartTheme.tooltipBorder}`,
                        borderRadius: 12,
                        fontSize: 12,
                        color: chartTheme.tooltipText,
                      }}
                      formatter={(v) => [formatNum(v as number), "Seguidores activos"]}
                    />
                    <Bar dataKey="followers" fill="var(--fb)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState label="Disponible con 100+ seguidores" />
            )}
          </Card>
        </>
      )}

      {/* ── Facebook ─────────────────────────────────── */}
      {fbConnected && (
        <>
          <h2 className="text-lg font-semibold mt-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--fb)]" />
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
                  color="var(--fb)"
                />
              );
            })}
            {fbInsights.length === 0 && (
              <p className="col-span-5 text-sm text-muted-foreground text-center py-4">Sin datos disponibles.</p>
            )}
          </div>

          {fbInsights.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {fbInsights.filter(m => m.values?.length > 1).slice(0, 4).map((m) => (
                <Card key={m.name} title={FB_LABELS[m.name] || m.title || m.name} color="var(--fb)">
                  <ChartArea
                    data={m.values.map((v) => ({ date: shortDate(v.end_time), value: v.value }))}
                    color="var(--fb)"
                    theme={chartTheme}
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
    <div className="bg-card/95 rounded-lg border border-border p-4 shadow-sm">
      <p className="text-2xl font-semibold" style={{ color }}>
        {formatNum(value ?? 0)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

let chartIdCounter = 0;

type ChartTheme = {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
};

function ChartArea({ data, color, label, theme }: { data: { date: string; value: number }[]; color: string; label?: string; theme: ChartTheme }) {
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
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: theme.axis }}
            interval={Math.max(0, Math.floor(data.length / 7) - 1)}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.axis }}
            width={50}
            tickFormatter={(v) => formatNum(v)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 12,
              fontSize: 13,
              color: theme.tooltipText,
              padding: "8px 14px",
            }}
            formatter={(v) => [Number(v).toLocaleString(), label || ""]}
            labelStyle={{ color: theme.axis, fontSize: 11, marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: theme.tooltipBg, strokeWidth: 2 }}
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
        <span className="text-lg text-muted-foreground/40">0</span>
      </div>
      <p className="text-xs text-muted-foreground/60">{label}</p>
    </div>
  );
}
