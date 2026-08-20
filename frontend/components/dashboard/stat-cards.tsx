"use client";

import {
  Activity,
  Building2,
  Calendar,
  Image as ImageIcon,
  Share2,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { DASH } from "./theme";

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Growth chip, e.g. "12.5%". Omitted on the secondary row. */
  delta?: string;
  /** Extra context rendered next to the delta chip. */
  note?: string;
  /** Renders the plum-filled treatment used for the lead metric. */
  featured?: boolean;
};

const PRIMARY_STATS: Stat[] = [
  { label: "Organizations", value: "124", icon: Building2, delta: "12.5%", featured: true },
  { label: "Total Users", value: "98", icon: UserRound, delta: "18.2%" },
  { label: "Active Users", value: "71", icon: Activity, delta: "20.4%", note: "72% of total" },
  { label: "Posts Created", value: "2,841", icon: Share2, delta: "28.7%" },
];

const SECONDARY_STATS: Stat[] = [
  { label: "Images Generated", value: "1,920", icon: ImageIcon },
  { label: "Reels Generated", value: "438", icon: Video },
  { label: "Social Accounts", value: "42", icon: Share2 },
  { label: "Calendars", value: "186", icon: Calendar },
];

function DeltaChip({ delta, featured }: { delta: string; featured?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-semibold"
      style={
        featured
          ? { backgroundColor: "rgba(255,255,255,0.18)", color: "#FFFFFF" }
          : { backgroundColor: DASH.greenBg, color: DASH.green }
      }
    >
      <span aria-hidden>↗</span>
      {delta}
    </span>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;

  return (
    <div
      className="rounded-2xl border p-5"
      style={
        stat.featured
          ? { backgroundColor: DASH.plum, borderColor: DASH.plum }
          : { backgroundColor: "#FFFFFF", borderColor: DASH.border }
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-[15px] font-semibold"
          style={{ color: stat.featured ? "#FFFFFF" : DASH.heading }}
        >
          {stat.label}
        </span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={
            stat.featured
              ? { backgroundColor: "rgba(255,255,255,0.18)", color: "#FFFFFF" }
              : { backgroundColor: DASH.pink, color: DASH.plum }
          }
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div
        className="mt-3 text-[38px] font-bold leading-none tracking-tight"
        style={{ color: stat.featured ? "#FFFFFF" : DASH.heading }}
      >
        {stat.value}
      </div>

      {stat.delta && (
        <div className="mt-3 flex items-center gap-2">
          <DeltaChip delta={stat.delta} featured={stat.featured} />
          {stat.note && (
            <span className="text-[13px]" style={{ color: DASH.muted }}>
              {stat.note}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function StatCards() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PRIMARY_STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SECONDARY_STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}
