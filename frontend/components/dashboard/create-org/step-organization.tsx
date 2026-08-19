"use client";

import { CheckCircle2 } from "lucide-react";
import {
  FieldHint,
  FieldLabel,
  SelectField,
  TextAreaField,
  TextField,
} from "../form-field";
import { DASH } from "../theme";
import { COUNTRIES, INDUSTRIES, type OrgDraft } from "./draft";
import { Notice } from "./notice";

export function StepOrganization({
  draft,
  update,
}: {
  draft: OrgDraft;
  update: (patch: Partial<OrgDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-[22px] font-bold" style={{ color: DASH.heading }}>
        Organization
      </h2>
      <p
        className="mt-2 max-w-2xl text-[15px] leading-relaxed"
        style={{ color: DASH.muted }}
      >
        Let’s start with the basics. Everything after this — the owner invitation,
        billing and the Command Center — hangs off this record.
      </p>

      <div className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="org-name" required>
            Organization / Brand Name
          </FieldLabel>
          <TextField
            id="org-name"
            value={draft.name}
            onChange={(name) => update({ name })}
          />
          <FieldHint>
            The name the customer sees everywhere in their Command Center.
          </FieldHint>
        </div>

        <div>
          <FieldLabel htmlFor="org-website" optional>
            Website
          </FieldLabel>
          <TextField
            id="org-website"
            value={draft.website}
            onChange={(website) => update({ website })}
          />
          <FieldHint>Used to pre-fill brand colours and logo on setup.</FieldHint>
        </div>

        <div>
          <FieldLabel htmlFor="org-industry" required>
            Industry
          </FieldLabel>
          <SelectField
            id="org-industry"
            value={draft.industry}
            onChange={(industry) => update({ industry })}
            options={INDUSTRIES}
          />
          <FieldHint>Sets the starter content templates and post cadence.</FieldHint>
        </div>

        <div>
          <FieldLabel htmlFor="org-country" required>
            Country
          </FieldLabel>
          <SelectField
            id="org-country"
            value={draft.country}
            onChange={(country) => update({ country })}
            options={COUNTRIES}
          />
          <FieldHint>Drives currency, timezone and posting hours.</FieldHint>
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="org-description" optional>
            Description
          </FieldLabel>
          <TextAreaField
            id="org-description"
            value={draft.description}
            onChange={(description) => update({ description })}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#059669" }} />
        <span className="text-[15px]" style={{ color: DASH.heading }}>
          No existing organization matches this name or domain.
        </span>
      </div>

      <Notice>
        Nothing is created and no email is sent until{" "}
        <span className="font-bold">step 5</span>. Leaving now keeps a draft under{" "}
        <span className="font-bold">Organizations → Drafts</span>.
      </Notice>
    </>
  );
}
