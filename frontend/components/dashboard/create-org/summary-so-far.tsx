"use client";

import { DASH } from "../theme";
import { domainOf, INDUSTRY_EMOJI, type OrgDraft } from "./draft";
import { formatMoney, monthlyRate, planById } from "./plans";

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.09em]"
      style={{ color: DASH.subtle }}
    >
      {children}
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Running recap in the wizard's right rail.
 *
 * Sections appear as their step is completed, so step 2 shows the
 * organization only, step 3 adds the owner, and step 4 adds the plan.
 */
export function SummarySoFar({ draft, step }: { draft: OrgDraft; step: number }) {
  const plan = planById(draft.plan);

  return (
    <div className="rounded-2xl border bg-white" style={{ borderColor: DASH.border }}>
      <h2
        className="border-b px-6 py-5 text-[17px] font-bold"
        style={{ borderColor: DASH.border, color: DASH.heading }}
      >
        Summary so far
      </h2>

      <div className="space-y-5 px-6 py-5">
        <div>
          <SectionLabel>Organization</SectionLabel>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl"
              style={{ borderColor: DASH.border, backgroundColor: "#FAFAFB" }}
              aria-hidden
            >
              {INDUSTRY_EMOJI[draft.industry] ?? "🏢"}
            </span>
            <div className="min-w-0 leading-tight">
              <div
                className="truncate text-[16px] font-bold"
                style={{ color: DASH.heading }}
              >
                {draft.name}
              </div>
              <div className="mt-0.5 truncate text-[14px]" style={{ color: DASH.muted }}>
                {domainOf(draft.website)} · {draft.country}
              </div>
            </div>
          </div>
        </div>

        {step >= 3 && (
          <div>
            <SectionLabel>Owner</SectionLabel>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ backgroundColor: DASH.pink, color: DASH.plum }}
              >
                {initialsOf(draft.ownerName)}
              </span>
              <div className="min-w-0 leading-tight">
                <div
                  className="truncate text-[16px] font-bold"
                  style={{ color: DASH.heading }}
                >
                  {draft.ownerName}
                </div>
                <div
                  className="mt-0.5 truncate text-[14px]"
                  style={{ color: DASH.muted }}
                >
                  {draft.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {step >= 4 && (
          <div>
            <SectionLabel>Plan</SectionLabel>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-[13px] font-semibold"
                style={{ backgroundColor: DASH.pink, color: DASH.plum }}
              >
                {plan.id}
              </span>
              <span className="text-[15px]" style={{ color: DASH.heading }}>
                {formatMoney(monthlyRate(plan, draft.annualBilling))}/mo · {plan.seats}{" "}
                seats
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
