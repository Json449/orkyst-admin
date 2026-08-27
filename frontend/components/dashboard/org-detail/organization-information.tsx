import { ArrowUpRight } from "lucide-react";
import { DASH } from "../theme";
import type { Organization } from "../organizations-data";
import { planById, formatMoney } from "../create-org/plans";
import type { OrgDetail } from "./detail-data";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.09em]"
        style={{ color: DASH.subtle }}
      >
        {label}
      </div>
      <div className="mt-2 text-[16px]" style={{ color: DASH.heading }}>
        {children}
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrganizationInformation({
  org,
  detail,
}: {
  org: Organization;
  detail: OrgDetail;
}) {
  const plan = planById(org.plan);
  const website = org.website || "";

  return (
    <div
      className="flex h-full flex-col rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div
        className="flex items-center justify-between gap-4 border-b px-6 py-5"
        style={{ borderColor: DASH.border }}
      >
        <h2 className="text-[18px] font-bold" style={{ color: DASH.heading }}>
          Organization Information
        </h2>
        <button
          className="text-[15px] font-semibold hover:underline"
          style={{ color: DASH.accent }}
        >
          Edit
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <Field label="Owner">
            <span className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ backgroundColor: DASH.pink, color: DASH.plum }}
              >
                {initialsOf(org.owner)}
              </span>
              {org.owner}
            </span>
          </Field>

          <Field label="Industry">{org.industry}</Field>

          <Field label="Owner Email">
            {org.ownerEmail ? (
              <a
                href={`mailto:${org.ownerEmail}`}
                className="font-medium hover:underline"
                style={{ color: DASH.accent }}
              >
                {org.ownerEmail}
              </a>
            ) : (
              <span style={{ color: DASH.muted }}>Not provided</span>
            )}
          </Field>

          <Field label="Website">
            {website ? (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium hover:underline"
                style={{ color: DASH.accent }}
              >
                {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : (
              <span style={{ color: DASH.muted }}>Not provided</span>
            )}
          </Field>

          <Field label="Country">{org.country}</Field>

          <Field label="Plan">
            {plan.id} · {formatMoney(plan.price)}/mo
          </Field>

          <Field label="Joined">{detail.joinedFull}</Field>
        </div>

        {detail.description && (
          <p
            className="mt-6 border-t pt-6 text-[16px] leading-relaxed"
            style={{ borderColor: DASH.border, color: DASH.heading }}
          >
            {detail.description}
          </p>
        )}
      </div>
    </div>
  );
}
