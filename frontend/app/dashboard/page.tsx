"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCards } from "@/components/dashboard/stat-cards";
import { UserGrowthCard } from "@/components/dashboard/user-growth-card";
import { ContentGeneratedCard } from "@/components/dashboard/content-generated-card";
import { OnboardingFunnelCard } from "@/components/dashboard/onboarding-funnel-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { TopOrganizationsCard } from "@/components/dashboard/top-organizations-card";
import { DASH } from "@/components/dashboard/theme";
import { fetchAdminOrganizations, fetchAdminRecentActivity, fetchAdminUserStats, fetchAuthMe } from "@/lib/api";

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [stats, organizations, recentActivity, auth] = await Promise.all([
        fetchAdminUserStats(), fetchAdminOrganizations({ pageSize: 100 }), fetchAdminRecentActivity(), fetchAuthMe(),
      ]);
      return { stats, organizations, recentActivity, auth };
    },
  });
  const { stats, organizations, recentActivity, auth } = dashboardQuery.data ?? {};
  const localPart = auth?.email?.split("@")[0].split(/[._-]/)[0];
  const adminName = localPart ? localPart.charAt(0).toUpperCase() + localPart.slice(1) : "Admin";
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Unable to load dashboard";

  if (dashboardQuery.isError) return <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: DASH.border }}><p className="font-semibold" style={{ color: DASH.heading }}>Dashboard data could not be loaded</p><p className="mt-1 text-sm" style={{ color: DASH.muted }}>{error}</p><button onClick={() => dashboardQuery.refetch()} className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: DASH.plum }}>Try again</button></div>;

  if (!stats || !organizations || !recentActivity) return <div className="space-y-5"><div className="h-20 animate-pulse rounded-2xl bg-[#F3F1F5]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-[#F3F1F5]" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-[#F3F1F5]" /></div>;

  const activeOrganizations = organizations.items.filter((org) => org.status === "Active").length;
  return <><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[32px] font-bold leading-tight tracking-tight" style={{ color: DASH.heading }}>Welcome, {adminName} <span aria-hidden>👋</span></h1><p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>Live activity across Orkyst · last {stats.lookbackDays} days</p></div><span className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium" style={{ borderColor: DASH.border, color: DASH.heading }}>Live data</span></div><div className="mt-7 space-y-5"><StatCards stats={stats} organizationCount={organizations.statusCounts.all} activeOrganizationCount={activeOrganizations} /><div className="grid gap-5 lg:grid-cols-3"><div className="lg:col-span-2"><UserGrowthCard stats={stats} /></div><ContentGeneratedCard stats={stats} /></div><div className="grid gap-5 lg:grid-cols-3"><div className="lg:col-span-2"><OnboardingFunnelCard stats={stats} /></div><RecentActivityCard activity={recentActivity.items} /></div><TopOrganizationsCard organizations={organizations.items} /></div></>;
}
