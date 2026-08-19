"use client";

import Link from "next/link";
import { DASH, FUNNEL_BLUES } from "./theme";

type Step = {
  label: string;
  value: number;
  /** Conversion caption shown under the bar; absent on the first step. */
  caption?: string;
  /** Emphasised end-to-end figure appended to the final caption. */
  highlight?: string;
};

const STEPS: Step[] = [
  { label: "Invited", value: 18 },
  { label: "Accepted", value: 12, caption: "67% of invited accepted" },
  { label: "Setup Started", value: 7, caption: "58% of accepted began setup" },
  {
    label: "Activated",
    value: 5,
    caption: "71% of setup completed",
    highlight: "28% invited → activated",
  },
];

const TOP = STEPS[0].value;

export function OnboardingFunnelCard() {
  return (
    <div
      className="rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div
        className="flex items-start justify-between gap-4 border-b p-6"
        style={{ borderColor: DASH.border }}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: DASH.heading }}>
            Onboarding Funnel
          </h2>
          <p className="mt-1 text-sm" style={{ color: DASH.muted }}>
            Invitation through to first calendar
          </p>
        </div>
        <Link
          href="#"
          className="shrink-0 text-sm font-bold hover:underline"
          style={{ color: DASH.accent }}
        >
          Open Onboarding →
        </Link>
      </div>

      <div className="space-y-6 p-6">
        {STEPS.map((step, index) => (
          <div key={step.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold" style={{ color: DASH.heading }}>
                {step.label}
              </span>
              <span className="text-sm font-bold" style={{ color: DASH.heading }}>
                {step.value}
              </span>
            </div>

            <div className="mt-2 h-8 w-full overflow-hidden rounded-md bg-[#F4F3F7]">
              <div
                className="flex h-full items-center rounded-md px-3 text-[13px] font-bold text-white"
                style={{
                  width: `${(step.value / TOP) * 100}%`,
                  backgroundColor: FUNNEL_BLUES[index],
                }}
              >
                {step.value}
              </div>
            </div>

            {step.caption && (
              <p className="mt-2 text-[13px]" style={{ color: DASH.subtle }}>
                ↓ {step.caption}
                {step.highlight && (
                  <>
                    {" · "}
                    <span className="font-bold" style={{ color: DASH.heading }}>
                      {step.highlight}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
