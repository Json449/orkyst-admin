"use client";

import { DASH } from "../theme";
import type { OrgDraft } from "./draft";
import {
  ANNUAL_DISCOUNT,
  firstChargeDate,
  formatMoney,
  monthlyRate,
  planById,
} from "./plans";

export function BillingCard({ draft }: { draft: OrgDraft }) {
  const plan = planById(draft.plan);
  const rate = monthlyRate(plan, draft.annualBilling);
  const annualRate = monthlyRate(plan, true);
  const annualTotal = Math.round(annualRate * 12);

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "#F5D5E5" }}
    >
      <h2
        className="px-6 py-4 text-[17px] font-bold"
        style={{ backgroundColor: "#FDF2F8", color: DASH.plum }}
      >
        Billing
      </h2>

      <div className="bg-white px-6 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[15px]" style={{ color: DASH.heading }}>
            {plan.id} · {draft.annualBilling ? "annual" : "monthly"}
          </span>
          <span className="shrink-0">
            <span className="text-[24px] font-bold" style={{ color: DASH.heading }}>
              {formatMoney(rate)}
            </span>
            <span className="text-[14px]" style={{ color: DASH.muted }}>
              /mo
            </span>
          </span>
        </div>

        <div
          className="mt-4 space-y-3 border-t pt-4"
          style={{ borderColor: DASH.border }}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-[15px]" style={{ color: DASH.muted }}>
              Due today
            </span>
            <span className="text-[15px] font-bold" style={{ color: DASH.green }}>
              $0.00
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[15px]" style={{ color: DASH.muted }}>
              First charge
            </span>
            <span className="text-[15px]" style={{ color: DASH.heading }}>
              {firstChargeDate(draft.trialPeriod)}
            </span>
          </div>
        </div>

        <p
          className="mt-4 border-t pt-4 text-[14px] leading-relaxed"
          style={{ borderColor: DASH.border, color: DASH.muted }}
        >
          {draft.annualBilling ? (
            <>
              Billed yearly at{" "}
              <span className="font-bold" style={{ color: DASH.heading }}>
                {formatMoney(annualTotal)}
              </span>{" "}
              — {Math.round(ANNUAL_DISCOUNT * 100)}% below monthly.
            </>
          ) : (
            <>
              Annual billing would drop this to{" "}
              <span className="font-bold" style={{ color: DASH.heading }}>
                {formatMoney(annualRate)}/mo
              </span>{" "}
              — {formatMoney(annualTotal)} a year.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
