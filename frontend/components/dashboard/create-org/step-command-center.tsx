"use client";

import { Diamond } from "lucide-react";
import { DASH } from "../theme";
import type { OrgDraft } from "./draft";
import { Notice } from "./notice";
import { RadioCard } from "./radio-card";
import { planById } from "./plans";

const ENTERPRISES = [
  "Select an enterprise…",
  "XYZ Enterprise",
  "ABC Cosmetics Group",
  "Northstar Holdings",
];

export function StepCommandCenter({
  draft,
  update,
}: {
  draft: OrgDraft;
  update: (patch: Partial<OrgDraft>) => void;
}) {
  const plan = planById(draft.plan);

  return (
    <>
      <h2 className="text-[22px] font-bold" style={{ color: DASH.heading }}>
        Command Center
      </h2>
      <p
        className="mt-2 max-w-2xl text-[15px] leading-relaxed"
        style={{ color: DASH.muted }}
      >
        Every organization gets a Command Center — the workspace its team logs into.
        Choose how this one is structured.
      </p>

      <div className="mt-7 space-y-4">
        <RadioCard
          name="command-center"
          checked={draft.commandCenter === "standalone"}
          onSelect={() => update({ commandCenter: "standalone" })}
          title="Create standalone Command Center"
        >
          A single workspace for this business. Right for most customers — one brand,
          one team, one content calendar.
          <span
            className="mt-4 block rounded-xl border bg-white p-4"
            style={{ borderColor: DASH.border }}
          >
            <span
              className="block text-[11px] font-semibold uppercase tracking-[0.09em]"
              style={{ color: DASH.subtle }}
            >
              Will be created
            </span>
            <span className="mt-3 flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2">
                <Diamond className="h-4 w-4 shrink-0" style={{ color: DASH.subtle }} />
                <span
                  className="truncate text-[16px] font-bold"
                  style={{ color: DASH.heading }}
                >
                  {draft.name}
                </span>
              </span>
              <span className="shrink-0 text-[14px]" style={{ color: DASH.muted }}>
                Standalone · {plan.seats} seats
              </span>
            </span>
          </span>
        </RadioCard>

        <RadioCard
          name="command-center"
          checked={draft.commandCenter === "enterprise"}
          onSelect={() => update({ commandCenter: "enterprise" })}
          title="Attach to an existing Enterprise"
        >
          Adds this organization as a franchise under an enterprise parent. Corporate
          keeps brand guardrails; the franchise runs local campaigns.
          <span className="mt-4 block">
            <span
              className="mb-2 block text-[15px] font-bold"
              style={{ color: DASH.muted }}
            >
              Parent Enterprise
            </span>
            <select
              value={draft.parentEnterprise}
              onChange={(event) => update({ parentEnterprise: event.target.value })}
              disabled={draft.commandCenter !== "enterprise"}
              className="w-full rounded-xl border bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#8A1253]/15 disabled:cursor-not-allowed"
              style={{
                borderColor: DASH.border,
                color:
                  draft.parentEnterprise === ENTERPRISES[0]
                    ? DASH.subtle
                    : DASH.heading,
              }}
            >
              {ENTERPRISES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </span>
        </RadioCard>
      </div>

      <Notice>
        Plan is set to <span className="font-bold">{plan.id}</span>, so the enterprise
        option is available but will upgrade billing. Choosing{" "}
        <span className="font-bold">Enterprise</span> on step 3 instead creates an{" "}
        <span className="font-bold">Enterprise Command Center</span> with its own
        franchise tree.
      </Notice>
    </>
  );
}
