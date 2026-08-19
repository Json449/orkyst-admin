"use client";

import { TriangleAlert } from "lucide-react";
import { FieldHint, FieldLabel, SelectField } from "../form-field";
import { DASH } from "../theme";
import type { OrgDraft } from "./draft";
import {
  formatMoney,
  monthlyRate,
  PLANS,
  TRIAL_PERIODS,
  type PlanOption,
} from "./plans";

function BillingCycleToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[#F3F4F6] p-1">
      {[false, true].map((isAnnual) => {
        const active = annual === isAnnual;
        return (
          <button
            key={String(isAnnual)}
            onClick={() => onChange(isAnnual)}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-[15px] transition-colors"
            style={
              active
                ? { backgroundColor: "#FFFFFF", color: DASH.plum, fontWeight: 700 }
                : { color: DASH.muted }
            }
          >
            {isAnnual ? "Annual" : "Monthly"}
            {isAnnual && (
              <span className="text-[13px]" style={{ color: DASH.muted }}>
                −15%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  annual,
  onSelect,
}: {
  plan: PlanOption;
  selected: boolean;
  annual: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="relative">
      {plan.badge && (
        <span
          className="absolute -top-3 right-4 z-10 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white"
          style={{ backgroundColor: DASH.plum }}
        >
          {plan.badge}
        </span>
      )}

      <label
        className="flex cursor-pointer gap-4 rounded-xl p-5 transition-colors"
        style={{
          backgroundColor: selected ? "#FDF2F8" : "#FFFFFF",
          boxShadow: `inset 0 0 0 ${selected ? 2 : 1}px ${selected ? DASH.plum : DASH.border}`,
        }}
      >
        <input
          type="radio"
          name="plan"
          checked={selected}
          onChange={onSelect}
          className="sr-only"
        />
        <span
          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ boxShadow: `inset 0 0 0 2px ${selected ? DASH.plum : "#D1D5DB"}` }}
        >
          {selected && (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DASH.plum }}
            />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[17px] font-bold" style={{ color: DASH.heading }}>
              {plan.id}
            </span>
            <span className="shrink-0">
              <span className="text-[24px] font-bold" style={{ color: DASH.heading }}>
                {formatMoney(monthlyRate(plan, annual))}
              </span>
              <span className="ml-1 text-[14px]" style={{ color: DASH.muted }}>
                /mo
              </span>
            </span>
          </div>

          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: DASH.muted }}>
            {plan.blurb}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {plan.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[#F3F4F6] px-3 py-1.5 text-[13px] font-medium"
                style={{ color: "#4B5563" }}
              >
                {feature}
              </span>
            ))}
          </div>

          {plan.caveat && (
            <div
              className="mt-4 flex items-start gap-3 rounded-lg p-4"
              style={{ backgroundColor: "#FFFBEB" }}
            >
              <TriangleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "#B45309" }}
              />
              <p className="text-[14px] leading-relaxed" style={{ color: "#92400E" }}>
                Picking Enterprise changes <span className="font-bold">step 4</span> —
                you’ll build an{" "}
                <span className="font-bold">Enterprise Command Center</span> with a
                franchise tree instead of a standalone workspace.
              </p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

export function StepPlan({
  draft,
  update,
}: {
  draft: OrgDraft;
  update: (patch: Partial<OrgDraft>) => void;
}) {
  const billingContacts = [
    `Same as owner — ${draft.ownerName}`,
    "Add a different billing contact",
  ];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-[22px] font-bold" style={{ color: DASH.heading }}>
            Plan
          </h2>
          <p
            className="mt-2 max-w-md text-[15px] leading-relaxed"
            style={{ color: DASH.muted }}
          >
            Sets seats, connected accounts and AI quota. Changeable later from the
            organization’s billing tab — nothing here is permanent.
          </p>
        </div>

        <BillingCycleToggle
          annual={draft.annualBilling}
          onChange={(annualBilling) => update({ annualBilling })}
        />
      </div>

      <div className="mt-7 space-y-5">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={draft.plan === plan.id}
            annual={draft.annualBilling}
            onSelect={() => update({ plan: plan.id })}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="trial-period">Trial period</FieldLabel>
          <SelectField
            id="trial-period"
            value={draft.trialPeriod}
            onChange={(trialPeriod) => update({ trialPeriod })}
            options={TRIAL_PERIODS}
          />
          <FieldHint>Billing starts the day the trial ends.</FieldHint>
        </div>

        <div>
          <FieldLabel htmlFor="billing-contact">Billing contact</FieldLabel>
          <SelectField
            id="billing-contact"
            value={
              billingContacts.includes(draft.billingContact)
                ? draft.billingContact
                : billingContacts[0]
            }
            onChange={(billingContact) => update({ billingContact })}
            options={billingContacts}
          />
          <FieldHint>Invoices and receipts go to this address.</FieldHint>
        </div>
      </div>
    </>
  );
}
