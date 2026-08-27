"use client";

import Link from "next/link";
import type { AdminUserStatsData } from "@/lib/api";
import { DASH, FUNNEL_BLUES } from "./theme";

export function OnboardingFunnelCard({ stats }: { stats: AdminUserStatsData }) {
  const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
  const steps = [
    { label: "Registered", value: stats.totals.totalUsers },
    { label: "Verified", value: stats.totals.verifiedUsers, caption: `${percent(stats.totals.verifiedUsers, stats.totals.totalUsers)}% of registered users verified` },
    { label: "Onboarded", value: stats.totals.onboardedUsers, caption: `${percent(stats.totals.onboardedUsers, stats.totals.verifiedUsers)}% of verified users onboarded` },
    { label: "Active (30 days)", value: stats.totals.activeUsers30d, caption: `${stats.totals.activeRate30dPct}% of all users recently active` },
  ];
  const top = Math.max(1, steps[0].value);
  return <div className="rounded-2xl border bg-white" style={{ borderColor: DASH.border }}><div className="flex items-start justify-between gap-4 border-b p-6" style={{ borderColor: DASH.border }}><div><h2 className="text-lg font-bold" style={{ color: DASH.heading }}>User Onboarding Funnel</h2><p className="mt-1 text-sm" style={{ color: DASH.muted }}>Registration through recent activity</p></div><Link href="/dashboard/users" className="shrink-0 text-sm font-bold hover:underline" style={{ color: DASH.accent }}>View users →</Link></div><div className="space-y-6 p-6">{steps.map((step, index) => <div key={step.label}><div className="flex items-baseline justify-between"><span className="text-sm font-bold" style={{ color: DASH.heading }}>{step.label}</span><span className="text-sm font-bold" style={{ color: DASH.heading }}>{step.value}</span></div><div className="mt-2 h-8 w-full overflow-hidden rounded-md bg-[#F4F3F7]"><div className="flex h-full items-center rounded-md px-3 text-[13px] font-bold text-white" style={{ width: `${Math.max(step.value ? 8 : 0, (step.value / top) * 100)}%`, backgroundColor: FUNNEL_BLUES[index] }}>{step.value}</div></div>{step.caption && <p className="mt-2 text-[13px]" style={{ color: DASH.subtle }}>↓ {step.caption}</p>}</div>)}</div></div>;
}
