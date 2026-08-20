import { Check } from "lucide-react";
import { DASH } from "../theme";
import type { Organization } from "../organizations-data";
import { ONBOARDING_MILESTONE_COUNT, type OrgDetail } from "./detail-data";

export function OnboardingProgress({
  org,
  detail,
}: {
  org: Organization;
  detail: OrgDetail;
}) {
  const complete = org.onboarding >= 100;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h2 className="text-[18px] font-bold" style={{ color: DASH.heading }}>
          Onboarding Progress
        </h2>
        <span
          className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold"
          style={
            complete
              ? { backgroundColor: DASH.greenBg, color: DASH.green }
              : { backgroundColor: "#EFF6FF", color: "#2563EB" }
          }
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {org.onboarding}% complete
        </span>
      </div>

      <div className="px-6 pb-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEDF2]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${org.onboarding}%`,
              backgroundColor: complete ? "#10B981" : "#3B82F6",
            }}
          />
        </div>

        <ul className="mt-5 space-y-4">
          {detail.onboardingSteps.map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: DASH.greenBg }}
              >
                <Check className="h-3 w-3" style={{ color: DASH.green }} strokeWidth={3} />
              </span>
              <span className="flex-1 text-[16px]" style={{ color: DASH.heading }}>
                {step.label}
              </span>
              {step.date && (
                <span className="shrink-0 text-[14px]" style={{ color: DASH.subtle }}>
                  {step.date}
                </span>
              )}
            </li>
          ))}

          {detail.onboardingSteps.length < ONBOARDING_MILESTONE_COUNT && (
            <li className="pt-1 text-[14px]" style={{ color: DASH.subtle }}>
              {ONBOARDING_MILESTONE_COUNT - detail.onboardingSteps.length} step
              {ONBOARDING_MILESTONE_COUNT - detail.onboardingSteps.length === 1
                ? ""
                : "s"}{" "}
              remaining
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
