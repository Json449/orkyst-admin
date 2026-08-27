"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { PlanPill, StatusPill } from "./pills";
import { DASH } from "./theme";
import type { Organization } from "./organizations-data";

export { ORGANIZATIONS } from "./organizations-data";
export type { Organization } from "./organizations-data";

/** Bar colour tracks completion, not status — a stalled account reads amber. */
function onboardingColor(percent: number): string {
  if (percent >= 100) return "#10B981";
  if (percent >= 60) return "#3B82F6";
  return "#D97706";
}

const HEAD_CLASS =
  "px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]";

function joinedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function OrganizationsTable({ rows }: { rows: Organization[] }) {
  const router = useRouter();

  return (
    <div
      className="overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1240px] border-collapse text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: DASH.border }}>
              <th className={HEAD_CLASS}>Organization</th>
              <th className={HEAD_CLASS}>Owner Email</th>
              <th className={HEAD_CLASS}>Plan</th>
              <th className={HEAD_CLASS}>Users</th>
              <th className={HEAD_CLASS}>Status</th>
              <th className={HEAD_CLASS}>Onboarding</th>
              <th className={HEAD_CLASS}>Activity</th>
              <th className={HEAD_CLASS}>Joined</th>
              <th className={HEAD_CLASS} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((org) => (
              <tr
                key={org.slug}
                onClick={() => router.push(`/dashboard/organizations/${org.slug}`)}
                className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-[#FAFAFB]"
                style={{ borderColor: DASH.border }}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg"
                      style={{ borderColor: DASH.border, backgroundColor: "#FAFAFB" }}
                      aria-hidden
                    >
                      {org.emoji}
                    </span>
                    <div className="leading-tight">
                      <Link
                        href={`/dashboard/organizations/${org.slug}`}
                        className="text-[15px] font-bold hover:underline"
                        style={{ color: DASH.heading }}
                      >
                        {org.name}
                      </Link>
                      <div className="mt-0.5 text-[13px]" style={{ color: DASH.muted }}>
                        {org.sector}
                        {org.franchises && (
                          <>
                            {" · "}
                            <span className="font-bold" style={{ color: DASH.accent }}>
                              {org.franchises} franchises
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-[14px]">
                  {org.ownerEmail ? (
                    <a
                      href={`mailto:${org.ownerEmail}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium hover:underline"
                      style={{ color: DASH.accent }}
                    >
                      {org.ownerEmail}
                    </a>
                  ) : (
                    <span style={{ color: DASH.muted }}>Not provided</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <PlanPill plan={org.plan} />
                </td>
                <td
                  className="px-4 py-4 text-left text-[15px]"
                  style={{ color: DASH.heading }}
                >
                  {org.users}
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={org.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#EFEDF2]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${org.onboarding}%`,
                          backgroundColor: onboardingColor(org.onboarding),
                        }}
                      />
                    </div>
                    <span className="text-[13px]" style={{ color: DASH.muted }}>
                      {org.onboarding}%
                    </span>
                  </div>
                </td>
                <td
                  className="whitespace-nowrap px-4 py-4 text-left text-[15px]"
                  style={{ color: DASH.heading }}
                >
                  {org.posts} posts
                </td>
                <td
                  className="whitespace-nowrap px-4 py-4 text-[15px]"
                  style={{ color: DASH.heading }}
                >
                  {joinedDate(org.joined)}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-md p-1 transition-colors hover:bg-[#F3F4F6]"
                    aria-label={`Actions for ${org.name}`}
                  >
                    <MoreHorizontal className="h-5 w-5" style={{ color: DASH.subtle }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
