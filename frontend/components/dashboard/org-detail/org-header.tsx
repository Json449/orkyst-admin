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
        <div className="flex items-start gap-5">
          <span
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border text-4xl"
            style={{ borderColor: DASH.border, backgroundColor: "#FFFFFF" }}
            aria-hidden
          >
            {org.emoji}
          </span>

          <div>
            <h1
              className="text-[36px] font-bold leading-tight tracking-tight"
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

        <div className="flex shrink-0 items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FAFAFB]"
            style={{ borderColor: DASH.border, color: DASH.heading }}
          >
            <ExternalLink className="h-4 w-4" />
            Open Command Center
          </button>
          <button
            className="flex items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FFFBEB]"
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
        className="mt-7 flex items-center gap-8 overflow-x-auto border-b"
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
