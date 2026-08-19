"use client";

import { DASH } from "./theme";

export type Plan = "Enterprise" | "Pro" | "Basic";
export type OrgStatus = "Active" | "Onboarding" | "Pending" | "Suspended";

/** Enterprise gets the brand tint; the rest stay neutral. */
export function PlanPill({ plan }: { plan: Plan }) {
  const featured = plan === "Enterprise";
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-[13px] font-semibold"
      style={
        featured
          ? { backgroundColor: DASH.pink, color: DASH.plum }
          : { backgroundColor: "#F3F4F6", color: "#4B5563" }
      }
    >
      {plan}
    </span>
  );
}

const STATUS_STYLES: Record<OrgStatus, { bg: string; fg: string }> = {
  Active: { bg: "#ECFDF5", fg: "#059669" },
  Onboarding: { bg: "#EFF6FF", fg: "#2563EB" },
  Pending: { bg: "#FEF3C7", fg: "#B45309" },
  Suspended: { bg: "#FEE2E2", fg: "#DC2626" },
};

export function StatusPill({ status }: { status: OrgStatus }) {
  const tone = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
