"use client";

import { ChevronDown } from "lucide-react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { UserGrowthCard } from "@/components/dashboard/user-growth-card";
import { ContentGeneratedCard } from "@/components/dashboard/content-generated-card";
import { OnboardingFunnelCard } from "@/components/dashboard/onboarding-funnel-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { TopOrganizationsCard } from "@/components/dashboard/top-organizations-card";
import { DASH } from "@/components/dashboard/theme";

/**
 * Overview Dashboard.
 *
 * Figures are currently the approved design values; see the endpoints in
 * `lib/api.ts` to wire live data.
 */
export default function DashboardPage() {
  return (
    <>
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[32px] font-bold leading-tight tracking-tight"
            style={{ color: DASH.heading }}
          >
            Good morning, John <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>
            Here’s what’s happening across Orkyst.
          </p>
        </div>
        <button
          className="flex shrink-0 items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Last 30 days
          <ChevronDown className="h-4 w-4" style={{ color: DASH.muted }} />
        </button>
      </div>

      <div className="mt-7 space-y-5">
        <StatCards />

        {/* Growth + content mix */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UserGrowthCard />
          </div>
          <ContentGeneratedCard />
        </div>

        {/* Funnel + activity */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OnboardingFunnelCard />
          </div>
          <RecentActivityCard />
        </div>

        <TopOrganizationsCard />
      </div>
    </>
  );
}
