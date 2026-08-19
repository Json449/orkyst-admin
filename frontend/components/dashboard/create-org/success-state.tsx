"use client";

import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { DASH } from "../theme";
import type { OrgDraft } from "./draft";
import { trialDays } from "./plans";

export function SuccessState({
  draft,
  onCreateAnother,
}: {
  draft: OrgDraft;
  onCreateAnother: () => void;
}) {
  const days = trialDays(draft.trialPeriod);

  return (
    <div
      className="rounded-2xl border bg-white px-8 py-10"
      style={{ borderColor: DASH.border }}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "#ECFDF5" }}
        >
          <Check className="h-8 w-8" style={{ color: DASH.green }} strokeWidth={2.5} />
        </span>

        <h2
          className="mt-6 text-[26px] font-bold tracking-tight"
          style={{ color: DASH.heading }}
        >
          Organization created successfully
        </h2>
        <p className="mt-2 text-[16px]" style={{ color: DASH.muted }}>
          {draft.name} is set up with a{" "}
          {draft.commandCenter === "standalone" ? "standalone" : "enterprise"} Command
          Center.
        </p>
      </div>

      {/* Invitation status */}
      {draft.inviteOnCreate && (
        <div
          className="mt-8 rounded-xl border p-5"
          style={{ borderColor: DASH.border }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.09em]"
            style={{ color: DASH.subtle }}
          >
            Invitation sent to
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-3">
              <Mail className="h-5 w-5 shrink-0" style={{ color: DASH.plum }} />
              <span
                className="truncate text-[16px] font-bold"
                style={{ color: DASH.heading }}
              >
                {draft.email}
              </span>
            </span>
            <span
              className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold"
              style={{ backgroundColor: DASH.amberBg, color: DASH.amber }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Awaiting acceptance
            </span>
          </div>

          <p className="mt-4 text-[15px]" style={{ color: DASH.muted }}>
            The owner has {days} days to accept. Track progress in{" "}
            <Link
              href="/dashboard"
              className="font-bold hover:underline"
              style={{ color: DASH.accent }}
            >
              Onboarding
            </Link>
            .
          </p>
        </div>
      )}

      {/* Next actions */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onCreateAnother}
          className="rounded-xl border bg-white px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Create another
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border bg-white px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Go to Onboarding
        </Link>
        <Link
          href="/dashboard/organizations"
          className="rounded-xl px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: DASH.plum }}
        >
          View Organization
        </Link>
      </div>
    </div>
  );
}
