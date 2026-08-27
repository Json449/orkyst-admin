"use client";

import type { AdminUserStatsData } from "@/lib/api";
import { DASH } from "./theme";

export function ContentGeneratedCard({ stats }: { stats: AdminUserStatsData }) {
  const content = [
    { label: "Posts", value: stats.activityTotals.posts, color: "#2563EB" },
    { label: "Images", value: stats.activityTotals.images, color: "#F97316" },
    { label: "Reels", value: stats.activityTotals.reels, color: "#10B981" },
    { label: "Calendars", value: stats.activityTotals.calendars, color: "#F59E0B" },
  ];
  const total = content.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(1, ...content.map((row) => row.value));
  return <div className="flex h-full flex-col rounded-2xl border bg-white p-6" style={{ borderColor: DASH.border }}><h2 className="text-lg font-bold" style={{ color: DASH.heading }}>Content Generated</h2><div className="mt-6 space-y-5">{content.map((row) => <div key={row.label} className="flex items-center gap-3"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} /><span className="w-20 shrink-0 text-sm font-semibold" style={{ color: DASH.heading }}>{row.label}</span><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EFEDF2]"><div className="h-full rounded-full" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }} /></div><span className="w-14 shrink-0 text-right text-sm font-bold" style={{ color: DASH.heading }}>{row.value.toLocaleString()}</span></div>)}</div><div className="mt-auto border-t pt-5 text-sm" style={{ borderColor: DASH.border, color: DASH.muted }}><span className="font-bold" style={{ color: DASH.heading }}>{total.toLocaleString()}</span> generated this month</div></div>;
}
