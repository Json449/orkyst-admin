"use client";

import Link from "next/link";
import type { AdminRecentActivityItem } from "@/lib/api";
import { DASH } from "./theme";

function activityTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function RecentActivityCard({ activity }: { activity: AdminRecentActivityItem[] }) {
  return <div data-testid="recent-activity-card" className="flex h-full flex-col rounded-2xl border bg-white" style={{ borderColor: DASH.border }}><div className="flex items-center justify-between gap-4 border-b p-6" style={{ borderColor: DASH.border }}><h2 className="text-lg font-bold" style={{ color: DASH.heading }}>Recent Activity</h2><Link href="/dashboard/users" className="shrink-0 text-sm font-bold hover:underline" style={{ color: DASH.accent }}>View users →</Link></div>{activity.length ? <ol className="relative p-6"><span className="absolute bottom-8 left-[29px] top-8 w-px" style={{ backgroundColor: DASH.border }} aria-hidden />{activity.slice(0, 5).map((item) => <li data-testid="recent-activity-item" data-activity-kind={item.kind} key={`${item.kind}-${item.id}`} className="relative flex gap-4 pb-6 last:pb-0"><span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#8A1253] ring-4 ring-white" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold" style={{ color: DASH.heading }}>{item.label}: {item.title}</p><span className="shrink-0 whitespace-nowrap text-[13px]" style={{ color: DASH.subtle }}>{activityTime(item.createdAt)}</span></div>{item.metadata ? <p className="mt-1 text-[13px]" style={{ color: DASH.muted }}>{item.metadata}</p> : null}</div></li>)}</ol> : <p className="p-6 text-sm" style={{ color: DASH.muted }}>No recent activity.</p>}</div>;
}
