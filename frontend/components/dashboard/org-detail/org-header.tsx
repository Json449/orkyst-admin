import { ExternalLink, MoreHorizontal, ShieldCheck } from "lucide-react";
import { PlanPill, StatusPill } from "../pills";
import { DASH } from "../theme";
import type { Organization } from "../organizations-data";

const TABS = [
  "Overview",
  "Users",
  "Command Center",
  "Usage",
  "Social Accounts",
  "Activity",
  "Billing",
];

export function OrgHeader({ org }: { org: Organization }) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-3xl sm:h-[72px] sm:w-[72px] sm:text-4xl"
            style={{ borderColor: DASH.border, backgroundColor: "#FFFFFF" }}
            aria-hidden
          >
            {org.emoji}
          </span>

          <div className="min-w-0">
            <h1
              className="truncate text-3xl font-bold leading-tight tracking-tight sm:text-[36px]"
              style={{ color: DASH.heading }}
            >
              {org.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PlanPill plan={org.plan} />
              <StatusPill status={org.status} />
              <span className="text-[15px]" style={{ color: DASH.subtle }}>
                ·
              </span>
              <span className="text-[15px]" style={{ color: DASH.muted }}>
                {org.industry}
              </span>
              <span className="text-[15px]" style={{ color: DASH.subtle }}>
                ·
              </span>
              <span className="text-[15px]" style={{ color: DASH.muted }}>
                {org.country}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FAFAFB] sm:flex-none sm:px-5"
            style={{ borderColor: DASH.border, color: DASH.heading }}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Open Command Center</span><span className="sm:hidden">Command Center</span>
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FFFBEB] sm:flex-none sm:px-5"
            style={{ borderColor: "#FDE68A", color: "#B45309" }}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin View
          </button>
          <button
            className="rounded-xl border bg-white p-2.5 transition-colors hover:bg-[#FAFAFB]"
            style={{ borderColor: DASH.border }}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-5 w-5" style={{ color: DASH.muted }} />
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div
        className="mt-5 flex items-center gap-6 overflow-x-auto border-b sm:mt-7 sm:gap-8"
        style={{ borderColor: DASH.border }}
      >
        {TABS.map((tab, index) => {
          const active = index === 0;
          return (
            <span
              key={tab}
              className="whitespace-nowrap pb-3 text-[16px]"
              style={
                active
                  ? {
                      color: DASH.plum,
                      fontWeight: 700,
                      boxShadow: `inset 0 -3px 0 0 ${DASH.plum}`,
                    }
                  : { color: DASH.muted }
              }
            >
              {tab}
            </span>
          );
        })}
      </div>
    </>
  );
}
