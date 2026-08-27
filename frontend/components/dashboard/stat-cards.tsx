"use client";

import {
  Activity,
  Building2,
  Calendar,
  Image as ImageIcon,
  Share2,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { AdminUserStatsData } from "@/lib/api";
import { DASH } from "./theme";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  note?: string;
  featured?: boolean;
};

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  return (
    <div className="rounded-2xl border p-5" style={stat.featured ? { backgroundColor: DASH.plum, borderColor: DASH.plum } : { backgroundColor: "#FFFFFF", borderColor: DASH.border }}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[15px] font-semibold" style={{ color: stat.featured ? "#FFFFFF" : DASH.heading }}>{stat.label}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={stat.featured ? { backgroundColor: "rgba(255,255,255,0.18)", color: "#FFFFFF" } : { backgroundColor: DASH.pink, color: DASH.plum }}><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      <div className="mt-3 text-[38px] font-bold leading-none tracking-tight" style={{ color: stat.featured ? "#FFFFFF" : DASH.heading }}>{stat.value.toLocaleString()}</div>
      {stat.note && <p className="mt-3 text-[13px]" style={{ color: stat.featured ? "rgba(255,255,255,0.78)" : DASH.muted }}>{stat.note}</p>}
    </div>
  );
}

export function StatCards({ stats, organizationCount, activeOrganizationCount }: { stats: AdminUserStatsData; organizationCount: number; activeOrganizationCount: number }) {
  const socialAccounts = stats.socialConnections.reduce((sum, row) => sum + row.count, 0);
  const primary: Stat[] = [
    { label: "Organizations", value: organizationCount, icon: Building2, note: `${activeOrganizationCount} active`, featured: true },
    { label: "Total Users", value: stats.totals.totalUsers, icon: UserRound, note: `${stats.totals.verifiedUsers} verified` },
    { label: "Active Users", value: stats.totals.activeUsers30d, icon: Activity, note: `${stats.totals.activeRate30dPct}% active in 30 days` },
    { label: "Content Events", value: stats.eventStats.totalEvents, icon: Share2, note: `${stats.eventStats.postedEvents} posted` },
  ];
  const secondary: Stat[] = [
    { label: "Images Generated", value: stats.activityTotals.images, icon: ImageIcon },
    { label: "Reels Generated", value: stats.activityTotals.reels, icon: Video },
    { label: "Social Accounts", value: socialAccounts, icon: Share2 },
    { label: "Calendars Generated", value: stats.activityTotals.calendars, icon: Calendar },
  ];
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{primary.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{secondary.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div></div>;
}
