"use client";

import { CheckCircle2 } from "lucide-react";
import { FieldHint, FieldLabel, TextField } from "../form-field";
import { DASH } from "../theme";
import type { OrgDraft } from "./draft";
import { Notice } from "./notice";
import { RadioCard } from "./radio-card";

export function StepOwner({
  draft,
  update,
}: {
  draft: OrgDraft;
  update: (patch: Partial<OrgDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-[22px] font-bold" style={{ color: DASH.heading }}>
        Owner
      </h2>
      <p
        className="mt-2 max-w-2xl text-[15px] leading-relaxed"
        style={{ color: DASH.muted }}
      >
        The person who receives the invitation and holds the account. They set their
        own password, then invite the rest of their team from inside the Command
        Center.
      </p>

      <div className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="owner-name" required>
            Full Name
          </FieldLabel>
          <TextField
            id="owner-name"
            value={draft.ownerName}
            onChange={(ownerName) => update({ ownerName })}
          />
        </div>

        <div>
          <FieldLabel htmlFor="owner-title" optional>
            Job Title
          </FieldLabel>
          <TextField
            id="owner-title"
            value={draft.jobTitle}
            onChange={(jobTitle) => update({ jobTitle })}
          />
        </div>

        <div>
          <FieldLabel htmlFor="owner-email" required>
            Email Address
          </FieldLabel>
          <TextField
            id="owner-email"
            value={draft.email}
            onChange={(email) => update({ email })}
          />
          <FieldHint>
            The invitation goes here — and it becomes their login.
          </FieldHint>
        </div>

        <div>
          <FieldLabel htmlFor="owner-phone" optional>
            Phone Number
          </FieldLabel>
          <TextField
            id="owner-phone"
            value={draft.phone}
            onChange={(phone) => update({ phone })}
          />
          <FieldHint>
            Used only for account recovery, never for marketing.
          </FieldHint>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#059669" }} />
        <span className="text-[15px]" style={{ color: DASH.heading }}>
          No Orkyst account uses this email yet.
        </span>
      </div>

      <div
        className="mt-7 text-[11px] font-semibold uppercase tracking-[0.09em]"
        style={{ color: DASH.subtle }}
      >
        Invitation
      </div>

      <div className="mt-3 space-y-4">
        <RadioCard
          name="invitation"
          checked={draft.inviteOnCreate}
          onSelect={() => update({ inviteOnCreate: true })}
          title="Send the invitation on create"
        >
          The email goes out the moment you finish step 5. The link is single-use and
          expires in <span className="font-bold">14 days</span>; the organization sits
          in <span className="font-bold">Pending</span> until it is accepted.
        </RadioCard>

        <RadioCard
          name="invitation"
          checked={!draft.inviteOnCreate}
          onSelect={() => update({ inviteOnCreate: false })}
          title="Create without inviting"
        >
          Sets everything up but sends nothing. Right for accounts sold ahead of a
          kickoff call — send the invitation later from{" "}
          <span className="font-bold">Onboarding</span>.
        </RadioCard>
      </div>

      <Notice>
        Owner is the one role that can’t be deleted — an organization always has
        exactly one. Transferring it later is possible from{" "}
        <span className="font-bold">Organization → Admin</span> and writes an entry to
        the <span className="font-bold">Activity Log</span>.
      </Notice>
    </>
  );
}
