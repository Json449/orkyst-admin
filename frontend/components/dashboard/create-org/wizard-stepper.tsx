"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { DASH } from "../theme";

export const CREATE_ORG_STEPS = [
  "Organization",
  "Owner",
  "Plan",
  "Command Center",
  "Review",
] as const;

/**
 * Horizontal step rail with completed / current / upcoming states.
 *
 * `current` is 1-based so it reads the same as the numbers on screen.
 * The connector after a step turns plum once that step is complete.
 */
export function WizardStepper({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-4">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;

        return (
          <Fragment key={label}>
            <li className="flex shrink-0 items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                style={
                  done
                    ? { backgroundColor: DASH.plum, color: "#FFFFFF" }
                    : active
                      ? {
                          backgroundColor: "#FFFFFF",
                          color: DASH.plum,
                          boxShadow: `inset 0 0 0 2px ${DASH.plum}`,
                        }
                      : { backgroundColor: "#F3F4F6", color: DASH.subtle }
                }
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : stepNumber}
              </span>
              <span
                className="whitespace-nowrap text-[15px]"
                style={
                  done
                    ? { color: DASH.heading, fontWeight: 600 }
                    : active
                      ? { color: DASH.plum, fontWeight: 700 }
                      : { color: DASH.subtle }
                }
              >
                {label}
              </span>
            </li>

            {stepNumber < steps.length && (
              <li
                aria-hidden
                className="min-w-8 flex-1 rounded-full"
                style={
                  done
                    ? { height: 2, backgroundColor: DASH.plum }
                    : { height: 1, backgroundColor: DASH.border }
                }
              />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
