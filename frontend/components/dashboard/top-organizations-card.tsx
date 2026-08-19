"use client";

import Link from "next/link";
import { PlanPill, type Plan } from "./pills";
import { DASH } from "./theme";

type Organization = {
  name: string;
  sector: string;
  emoji: string;
  plan: Plan;
  users: number;
  posts: number;
  images: number;
  /** Relative platform-usage score, 0–100, driving the activity bar. */
  activity: number;
};

const ORGANIZATIONS: Organization[] = [
  {
    name: "XYZ Enterprise",
    sector: "Retail & Franchise · Pakistan",
    emoji: "🏢",
    plan: "Enterprise",
    users: 42,
    posts: 312,
    images: 604,
    activity: 96,
  },
  {
    name: "ABC Cosmetics",
    sector: "Beauty & Personal Care · UAE",
    emoji: "💄",
    plan: "Pro",
    users: 8,
    posts: 72,
    images: 168,
    activity: 74,
  },
  {
    name: "GreenLeaf Organics",
    sector: "Food & Restaurant · Canada",
    emoji: "🌿",
    plan: "Pro",
    users: 6,
    posts: 58,
    images: 96,
    activity: 61,
  },
  {
    name: "Lots’a Pizza",
    sector: "Food & Restaurant · Philippines",
    emoji: "🍕",
    plan: "Basic",
    users: 4,
    posts: 30,
    images: 3,
    activity: 38,
  },
];

const HEAD_CLASS =
  "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]";

export function TopOrganizationsCard() {
  return (
    <div
      className="rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div className="flex items-start justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-bold" style={{ color: DASH.heading }}>
            Top Organizations
          </h2>
          <p className="mt-1 text-sm" style={{ color: DASH.muted }}>
            By platform usage this period
          </p>
        </div>
        <Link
          href="#"
          className="shrink-0 text-sm font-bold hover:underline"
          style={{ color: DASH.accent }}
        >
          View all organizations →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-y" style={{ borderColor: DASH.border }}>
              <th className={HEAD_CLASS}>Organization</th>
              <th className={HEAD_CLASS}>Plan</th>
              <th className={`${HEAD_CLASS} text-right`}>Users</th>
              <th className={`${HEAD_CLASS} text-right`}>Posts</th>
              <th className={`${HEAD_CLASS} text-right`}>Images</th>
              <th className={HEAD_CLASS}>Activity</th>
            </tr>
          </thead>
          <tbody>
            {ORGANIZATIONS.map((org) => (
              <tr
                key={org.name}
                className="border-b last:border-b-0"
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
                      <div className="text-[15px] font-bold" style={{ color: DASH.heading }}>
                        {org.name}
                      </div>
                      <div className="mt-0.5 text-[13px]" style={{ color: DASH.muted }}>
                        {org.sector}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <PlanPill plan={org.plan} />
                </td>
                <td className="px-4 py-4 text-right text-[15px]" style={{ color: DASH.heading }}>
                  {org.users}
                </td>
                <td className="px-4 py-4 text-right text-[15px]" style={{ color: DASH.heading }}>
                  {org.posts}
                </td>
                <td className="px-4 py-4 text-right text-[15px]" style={{ color: DASH.heading }}>
                  {org.images}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#EFEDF2]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${org.activity}%`, backgroundColor: DASH.plum }}
                      />
                    </div>
                    <span className="text-[13px]" style={{ color: DASH.muted }}>
                      {org.activity}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
