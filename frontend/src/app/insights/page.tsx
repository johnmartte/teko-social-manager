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

type AudienceMetric = {
  name: string;
  values: { value: Record<string, number> }[];
};

type OnlineFollowersMetric = {
  name: string;
  values: { value: Record<string, number>; end_time: string }[];
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

function parseGenderAge(raw: Record<string, number>) {
  const ageGroups: Record<string, { male: number; female: number; unknown: number }> = {};
  let totalMale = 0;
  let totalFemale = 0;
  let totalUnknown = 0;

  for (const [key, val] of Object.entries(raw)) {
    const [gender, age] = key.split(".");
    if (!ageGroups[age]) ageGroups[age] = { male: 0, female: 0, unknown: 0 };
    if (gender === "M") { ageGroups[age].male += val; totalMale += val; }
    else if (gender === "F") { ageGroups[age].female += val; totalFemale += val; }
    else { ageGroups[age].unknown += val; totalUnknown += val; }
  }

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

function parseLocations(raw: Record<string, number>, limit = 10) {
  return Object.entries(raw)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

function parseOnlineFollowers(data: OnlineFollowersMetric[]) {
  if (!data.length) return [];
  const latest = data[0].values?.[data[0].values.length - 1]?.value;
  if (!latest) return [];

  return Object.entries(latest)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([hour, count]) => ({
      hour: `${hour.padStart(2, "0")}:00`,
      followers: count,
    }));
}

/* ── Component ──────────────────────────────────────────────── */

export default function InsightsPage() {
  const { status } = useAuth();

  const [igInsights, setIgInsights] = useState<InsightMetric[]>([]);
  const [audience, setAudience] = useState<AudienceMetric[]>([]);
  const [onlineData, setOnlineData] = useState<OnlineFollowersMetric[]>([]);
  const [fbInsights, setFbInsights] = useState<InsightMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!status) return;
    setLoading(true);
    const promises: Promise<void>[] = [];

    if (status.instagram.connected) {
      promises.push(
        api<{ data: InsightMetric[] }>("/instagram/insights")
          .then((r) => setIgInsights(r.data || []))
          .catch(() => {})
      );
      promises.push(
        api<{ data: AudienceMetric[] }>("/instagram/audience")
          .then((r) => setAudience((r.data || []) as AudienceMetric[]))
          .catch(() => {})
      );
      promises.push(
        api<{ data: OnlineFollowersMetric[] }>("/instagram/online-followers")
          .then((r) => setOnlineData((r.data || []) as OnlineFollowersMetric[]))
          .catch(() => {})
      );
    }

    if (status.facebook.connected) {
      promises.push(
        api<{ data: InsightMetric[] }>("/facebook/page/insights?period=day")
          .then((r) => setFbInsights(r.data || []))
          .catch(() => {})
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }, [status]);

  /* ── Derived data ──────────────────────────────────── */

  const reachData = useMemo(() => {
    const metric = igInsights.find((m) => m.name === "reach");
    if (!metric?.values) return [];
    return metric.values.map((v) => ({
      date: shortDate(v.end_time),
      value: v.value,
    }));
  }, [igInsights]);

  const impressionsData = useMemo(() => {
    const metric = igInsights.find((m) => m.name === "impressions");
    if (!metric?.values) return [];
    return metric.values.map((v) => ({
      date: shortDate(v.end_time),
      value: v.value,
    }));
  }, [igInsights]);

  const followerData = useMemo(() => {
    const metric = igInsights.find((m) => m.name === "follower_count");
    if (!metric?.values) return [];
    return metric.values.map((v) => ({
      date: shortDate(v.end_time),
      value: v.value,
    }));
  }, [igInsights]);

  const profileViewsData = useMemo(() => {
    const metric = igInsights.find((m) => m.name === "profile_views");
    if (!metric?.values) return [];
    return metric.values.map((v) => ({
      date: shortDate(v.end_time),
      value: v.value,
    }));
  }, [igInsights]);

  const genderAgeRaw = useMemo(() => {
    const m = audience.find((a) => a.name === "audience_gender_age");
    if (!m?.values?.[0]?.value) return null;
    return parseGenderAge(m.values[0].value as Record<string, number>);
  }, [audience]);

  const cityData = useMemo(() => {
    const m = audience.find((a) => a.name === "audience_city");
    if (!m?.values?.[0]?.value) return [];
    return parseLocations(m.values[0].value as Record<string, number>);
  }, [audience]);

  const countryData = useMemo(() => {
    const m = audience.find((a) => a.name === "audience_country");
    if (!m?.values?.[0]?.value) return [];
    return parseLocations(m.values[0].value as Record<string, number>);
  }, [audience]);

  const onlineFollowers = useMemo(() => parseOnlineFollowers(onlineData), [onlineData]);

  /* ── Summary numbers ───────────────────────────────── */

  const latestVal = (name: string) => {
    const m = igInsights.find((i) => i.name === name);
    if (!m?.values?.length) return null;
    return m.values[m.values.length - 1].value;
  };

  const totalOverPeriod = (name: string) => {
    const m = igInsights.find((i) => i.name === name);
    if (!m?.values?.length) return null;
    return m.values.reduce((s, v) => s + v.value, 0);
  };

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

      {/* ── Instagram ────────────────────────────────── */}
      {igConnected && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Alcance total" value={totalOverPeriod("reach")} color="#e1306c" />
            <SummaryCard label="Impresiones" value={totalOverPeriod("impressions")} color="#405de6" />
            <SummaryCard label="Seguidores" value={latestVal("follower_count")} color="#833ab4" />
            <SummaryCard label="Visitas al perfil" value={totalOverPeriod("profile_views")} color="#f56040" />
          </div>

          {/* Reach + Impressions chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Alcance (30 dias)" color="#e1306c">
              {reachData.length > 0 ? (
                <ChartArea data={reachData} color="#e1306c" />
              ) : (
                <NoData />
              )}
            </Card>
            <Card title="Impresiones (30 dias)" color="#405de6">
              {impressionsData.length > 0 ? (
                <ChartArea data={impressionsData} color="#405de6" />
              ) : (
                <NoData />
              )}
            </Card>
          </div>

          {/* Follower growth + profile views */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Crecimiento de seguidores" color="#833ab4">
              {followerData.length > 0 ? (
                <ChartArea data={followerData} color="#833ab4" />
              ) : (
                <NoData />
              )}
            </Card>
            <Card title="Visitas al perfil" color="#f56040">
              {profileViewsData.length > 0 ? (
                <ChartArea data={profileViewsData} color="#f56040" />
              ) : (
                <NoData />
              )}
            </Card>
          </div>

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

function ChartArea({ data, color }: { data: { date: string; value: number }[]; color: string }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #eee)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} width={45} tickFormatter={(v) => formatNum(v)} />
          <Tooltip
            contentStyle={{
              background: "var(--color-card, #fff)",
              border: "1px solid var(--color-border, #eee)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) => [formatNum(v as number), ""]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function NoData() {
  return <p className="text-sm text-muted text-center py-8">Sin datos disponibles para este periodo.</p>;
}
