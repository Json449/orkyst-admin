"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  CREATE_ORG_STEPS,
  WizardStepper,
} from "@/components/dashboard/create-org/wizard-stepper";
import { WhatHappensNext } from "@/components/dashboard/create-org/what-happens-next";
import { SummarySoFar } from "@/components/dashboard/create-org/summary-so-far";
import { InvitationPreview } from "@/components/dashboard/create-org/invitation-preview";
import { BillingCard } from "@/components/dashboard/create-org/billing-card";
import { StepOrganization } from "@/components/dashboard/create-org/step-organization";
import { StepOwner } from "@/components/dashboard/create-org/step-owner";
import { StepPlan } from "@/components/dashboard/create-org/step-plan";
import { StepCommandCenter } from "@/components/dashboard/create-org/step-command-center";
import { StepReview } from "@/components/dashboard/create-org/step-review";
import { SuccessState } from "@/components/dashboard/create-org/success-state";
import {
  COUNTRIES,
  INDUSTRIES,
  type OrgDraft,
} from "@/components/dashboard/create-org/draft";
import { PERMISSION_MODULES } from "@/components/dashboard/create-org/plans";
import { DASH } from "@/components/dashboard/theme";

const INITIAL_DRAFT: OrgDraft = {
  name: "Lots’a Pizza",
  website: "https://lotsapizza.com.ph",
  industry: INDUSTRIES[0],
  country: COUNTRIES[0],
  description: "Delicious pizza made for Filipino families.",
  ownerName: "Carlo Reyes",
  jobTitle: "Marketing Manager",
  email: "marketing@lotsapizza.com.ph",
  phone: "+63 917 555 0100",
  inviteOnCreate: true,
  plan: "Basic",
  annualBilling: false,
  trialPeriod: "14 days",
  billingContact: "Same as owner — Carlo Reyes",
  commandCenter: "standalone",
  parentEnterprise: "Select an enterprise…",
  permissions: Object.fromEntries(
    PERMISSION_MODULES.map((module) => [module, "Full" as const]),
  ),
};

const LAST_STEP = CREATE_ORG_STEPS.length;

export default function CreateOrganizationPage() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OrgDraft>(INITIAL_DRAFT);
  const [created, setCreated] = useState(false);

  const update = (patch: Partial<OrgDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const reset = () => {
    setDraft(INITIAL_DRAFT);
    setStep(1);
    setCreated(false);
  };

  /** Review supplies its own actions, so the shared rail stops at step 4. */
  const showSideRail = step < LAST_STEP;

  if (created) {
    return (
      <>
        <PageHeading />
        <div className="mx-auto mt-7 max-w-3xl">
          <SuccessState draft={draft} onCreateAnother={reset} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading />

      <div
        className="mt-7 rounded-2xl border bg-white p-8"
        style={{ borderColor: DASH.border }}
      >
        <WizardStepper steps={CREATE_ORG_STEPS} current={step} />

        <div
          className={
            showSideRail ? "mt-10 grid gap-10 lg:grid-cols-3" : "mx-auto mt-10 max-w-4xl"
          }
        >
          <section className={showSideRail ? "lg:col-span-2" : undefined}>
            {step === 1 && <StepOrganization draft={draft} update={update} />}
            {step === 2 && <StepOwner draft={draft} update={update} />}
            {step === 3 && <StepPlan draft={draft} update={update} />}
            {step === 4 && <StepCommandCenter draft={draft} update={update} />}
            {step === 5 && (
              <StepReview
                draft={draft}
                update={update}
                goToStep={setStep}
                onSubmit={() => setCreated(true)}
              />
            )}
          </section>

          {showSideRail && (
            <aside className="lg:col-span-1">
              <div className="space-y-5">
                {step === 1 ? (
                  <WhatHappensNext />
                ) : (
                  <>
                    <SummarySoFar draft={draft} step={step} />
                    {step === 2 && draft.inviteOnCreate && (
                      <InvitationPreview draft={draft} />
                    )}
                    {step === 3 && <BillingCard draft={draft} />}
                  </>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStep((value) => Math.max(1, value - 1))}
                  disabled={step === 1}
                  className="rounded-xl border bg-white px-5 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[#FAFAFB] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: DASH.border,
                    color: step === 1 ? DASH.muted : DASH.heading,
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep((value) => Math.min(LAST_STEP, value + 1))}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: DASH.plum }}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

function PageHeading() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <nav
          className="flex items-center gap-2 text-[15px]"
          style={{ color: DASH.muted }}
        >
          <Link href="/dashboard/organizations" className="hover:underline">
            Organizations
          </Link>
          <ChevronRight className="h-4 w-4" style={{ color: DASH.subtle }} />
          <span>New</span>
        </nav>

        <h1
          className="mt-2 text-[36px] font-bold leading-tight tracking-tight"
          style={{ color: DASH.heading }}
        >
          Create Organization
        </h1>
        <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>
          Set up a customer account and send their invitation.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          className="rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Save draft
        </button>
        <Link
          href="/dashboard/organizations"
          className="rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
