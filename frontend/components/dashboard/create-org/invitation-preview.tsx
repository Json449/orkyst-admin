"use client";

import { OrkystLogo } from "@/components/orkyst-logo";
import { DASH } from "../theme";
import { firstNameOf, type OrgDraft } from "./draft";

/** Rendering of the email the owner receives, driven by the draft. */
export function InvitationPreview({ draft }: { draft: OrgDraft }) {
  const firstName = firstNameOf(draft.ownerName);

  return (
    <div className="rounded-2xl border bg-white" style={{ borderColor: DASH.border }}>
      <div className="px-6 py-5">
        <h2 className="text-[17px] font-bold" style={{ color: DASH.heading }}>
          Invitation preview
        </h2>
        <p className="mt-1 text-[14px]" style={{ color: DASH.muted }}>
          What {firstName || "the owner"} will receive
        </p>
      </div>

      {/* Envelope */}
      <div className="border-t px-6 py-4" style={{ borderColor: DASH.border }}>
        <p className="text-[14px]" style={{ color: DASH.muted }}>
          From{" "}
          <span style={{ color: DASH.heading }}>
            Orkyst &lt;no-reply@orkyst.com&gt;
          </span>
        </p>
        <p className="mt-2 text-[16px] font-bold" style={{ color: DASH.heading }}>
          You’ve been invited to manage {draft.name}
        </p>
      </div>

      {/* Body */}
      <div
        className="border-t px-6 py-6 text-center"
        style={{ borderColor: DASH.border }}
      >
        <div className="flex items-center justify-center">
          <OrkystLogo className="h-auto w-24" />
        </div>

        <p
          className="mt-4 text-[15px] leading-relaxed"
          style={{ color: DASH.heading }}
        >
          Hi {firstName || "there"} — <span className="font-bold">{draft.name}</span>{" "}
          is ready on Orkyst. Set your password and your Command Center is waiting.
        </p>

        <div
          className="mt-5 w-full rounded-xl px-5 py-3.5 text-[15px] font-bold text-white"
          style={{ backgroundColor: DASH.plum }}
        >
          Accept invitation
        </div>

        <p className="mt-3 text-[13px]" style={{ color: DASH.muted }}>
          Expires in 14 days · single use
        </p>
      </div>
    </div>
  );
}
