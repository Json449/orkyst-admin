"use client";

import { Mail } from "lucide-react";
import { DASH } from "../theme";
import type { OrgDraft } from "./draft";
import {
  formatMoney,
  monthlyRate,
  PERMISSION_LEVELS,
  PERMISSION_MODULES,
  planById,
  type PermissionLevel,
} from "./plans";

function SummaryTile({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-5" style={{ borderColor: DASH.border }}>
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.09em]"
          style={{ color: DASH.subtle }}
        >
          {label}
        </span>
        <button
          onClick={onEdit}
          className="text-[14px] font-semibold hover:underline"
          style={{ color: DASH.accent }}
        >
          Edit
        </button>
      </div>
      <div className="mt-3 leading-relaxed">{children}</div>
    </div>
  );
}

export function StepReview({
  draft,
  update,
  goToStep,
  onSubmit,
}: {
  draft: OrgDraft;
  update: (patch: Partial<OrgDraft>) => void;
  goToStep: (step: number) => void;
  onSubmit: () => void;
}) {
  const plan = planById(draft.plan);

  const setPermission = (module: string, level: PermissionLevel) =>
    update({ permissions: { ...draft.permissions, [module]: level } });

  return (
    <>
      {/* Recap tiles */}
      <div className="grid gap-5 sm:grid-cols-2">
        <SummaryTile label="Organization" onEdit={() => goToStep(1)}>
          <div className="text-[17px] font-bold" style={{ color: DASH.heading }}>
            {draft.name}
          </div>
          <div className="mt-1 text-[15px]" style={{ color: DASH.muted }}>
            {draft.industry}
          </div>
          <div className="text-[15px]" style={{ color: DASH.muted }}>
            {draft.country}
          </div>
        </SummaryTile>

        <SummaryTile label="Owner" onEdit={() => goToStep(2)}>
          <div className="text-[17px] font-bold" style={{ color: DASH.heading }}>
            {draft.ownerName}
          </div>
          <div className="mt-1 break-all text-[15px]" style={{ color: DASH.muted }}>
            {draft.email}
          </div>
          <div className="text-[15px]" style={{ color: DASH.muted }}>
            {draft.phone}
          </div>
        </SummaryTile>

        <SummaryTile label="Plan" onEdit={() => goToStep(3)}>
          <div className="text-[17px] font-bold" style={{ color: DASH.heading }}>
            {plan.id} — {formatMoney(monthlyRate(plan, draft.annualBilling))}/mo
          </div>
          <div className="mt-1 text-[15px]" style={{ color: DASH.muted }}>
            {plan.seats} seats · {plan.socialAccounts}
          </div>
        </SummaryTile>

        <SummaryTile label="Command Center" onEdit={() => goToStep(4)}>
          <div className="text-[17px] font-bold" style={{ color: DASH.heading }}>
            {draft.commandCenter === "standalone" ? "Standalone" : "Enterprise"}
          </div>
          <div className="mt-1 text-[15px]" style={{ color: DASH.muted }}>
            {draft.commandCenter === "standalone"
              ? `${draft.name} workspace`
              : draft.parentEnterprise}
          </div>
        </SummaryTile>
      </div>

      {/* Permissions */}
      <div
        className="mt-8 text-[11px] font-semibold uppercase tracking-[0.09em]"
        style={{ color: DASH.subtle }}
      >
        Initial permissions — owner
      </div>

      <table className="mt-3 w-full border-collapse text-left">
        <thead>
          <tr className="border-b" style={{ borderColor: DASH.border }}>
            <th
              className="py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: DASH.subtle }}
            >
              Module
            </th>
            {PERMISSION_LEVELS.map((level) => (
              <th
                key={level}
                className="w-28 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: DASH.subtle }}
              >
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map((module) => (
            <tr key={module} className="border-b" style={{ borderColor: DASH.border }}>
              <td
                className="py-4 text-[17px] font-bold"
                style={{ color: DASH.heading }}
              >
                {module}
              </td>
              {PERMISSION_LEVELS.map((level) => {
                const checked = draft.permissions[module] === level;
                return (
                  <td key={level} className="py-4 text-left">
                    <label className="inline-flex cursor-pointer">
                      <input
                        type="radio"
                        name={`perm-${module}`}
                        checked={checked}
                        onChange={() => setPermission(module, level)}
                        className="sr-only"
                      />
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{
                          boxShadow: `inset 0 0 0 2px ${checked ? DASH.plum : "#D1D5DB"}`,
                        }}
                      >
                        {checked && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: DASH.plum }}
                          />
                        )}
                      </span>
                      <span className="sr-only">
                        {level} access to {module}
                      </span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Actions */}
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          onClick={() => goToStep(4)}
          className="rounded-xl border bg-white px-7 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          className="flex flex-1 items-center justify-center gap-3 rounded-xl px-7 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: DASH.plum }}
        >
          <Mail className="h-5 w-5" />
          {draft.inviteOnCreate ? "Create & Send Invitation" : "Create Organization"}
        </button>
      </div>
    </>
  );
}
