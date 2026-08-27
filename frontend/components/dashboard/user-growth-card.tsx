"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { AdminUserStatsData } from "@/lib/api";
import { DASH, LINE_BLUE } from "./theme";

export function UserGrowthCard({ stats }: { stats: AdminUserStatsData }) {
  const signups = new Map(stats.signupTrend.map((row) => [row.date, row.count]));
  const periodSignups = stats.signupTrend.reduce((sum, row) => sum + row.count, 0);
  let cumulative = Math.max(0, stats.totals.totalUsers - periodSignups);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - Math.max(0, stats.lookbackDays - 1));
  const data = Array.from({ length: stats.lookbackDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    cumulative += signups.get(key) ?? 0;
    return { date: date.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" }), users: cumulative };
  });

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: DASH.border }}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold" style={{ color: DASH.heading }}>User Growth</h2><p className="mt-1 text-sm" style={{ color: DASH.muted }}>Cumulative users · last {stats.lookbackDays} days</p></div><span className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ backgroundColor: DASH.pink, color: DASH.plum }}>+{periodSignups} this period</span></div>
      <div className="mt-6 h-[260px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}><defs><linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={LINE_BLUE} stopOpacity={0.18} /><stop offset="100%" stopColor={LINE_BLUE} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#F1F0F4" /><XAxis dataKey="date" interval="preserveStartEnd" tickLine={false} axisLine={false} tick={{ fill: DASH.subtle, fontSize: 12 }} dy={8} /><YAxis allowDecimals={false} domain={[0, "auto"]} tickLine={false} axisLine={false} tick={{ fill: DASH.subtle, fontSize: 12 }} width={40} /><Area type="monotone" dataKey="users" stroke={LINE_BLUE} strokeWidth={2} fill="url(#userGrowthFill)" dot={false} activeDot={{ r: 4, fill: LINE_BLUE, stroke: "#FFFFFF", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>
    </div>
  );
}
