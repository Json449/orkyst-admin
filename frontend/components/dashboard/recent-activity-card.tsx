"use client";

import Link from "next/link";
import { DASH } from "./theme";

type Activity = {
  title: string;
  meta: string;
  time: string;
  /** Dot colour — green for wins, plum for structural changes, red for failures. */
  tone: "success" | "info" | "error";
};

const TONE_COLORS: Record<Activity["tone"], string> = {
  success: "#10B981",
  info: "#8A1253",
  error: "#DC2626",
};

const ACTIVITY: Activity[] = [
  {
    title: "Lots’a Pizza connected Instagram",
    meta: "@lotsapizza.ph · Maria Santos",
    time: "2h ago",
    tone: "success",
  },
  {
    title: "New user Sarah Khan verified",
    meta: "XYZ Enterprise",
    time: "3h ago",
    tone: "success",
  },
  {
    title: "ABC Cosmetics Command Center created",
    meta: "Standalone · 8 seats · John Doe",
    time: "Yesterday",
    tone: "info",
  },
  {
    title: "XYZ Enterprise added franchise",
    meta: "Peshawar Franchise · 2 users",
    time: "Yesterday",
    tone: "info",
  },
  {
    title: "Image generation failed",
    meta: "XYZ Media · model timeout after 3 retries",
    time: "Aug 11",
    tone: "error",
  },
];

export function RecentActivityCard() {
  return (
    <div
      className="flex h-full flex-col rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div
        className="flex items-center justify-between gap-4 border-b p-6"
        style={{ borderColor: DASH.border }}
      >
        <h2 className="text-lg font-bold" style={{ color: DASH.heading }}>
          Recent Activity
        </h2>
        <Link
          href="#"
          className="shrink-0 text-sm font-bold hover:underline"
          style={{ color: DASH.accent }}
        >
          View all →
        </Link>
      </div>

      <ol className="relative p-6">
        {/* Timeline rail */}
        <span
          className="absolute bottom-8 left-[29px] top-8 w-px"
          style={{ backgroundColor: DASH.border }}
          aria-hidden
        />
        {ACTIVITY.map((item) => (
          <li key={item.title} className="relative flex gap-4 pb-6 last:pb-0">
            <span
              className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white"
              style={{ backgroundColor: TONE_COLORS[item.tone] }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold" style={{ color: DASH.heading }}>
                  {item.title}
                </p>
                <span
                  className="shrink-0 text-[13px] whitespace-nowrap"
                  style={{ color: DASH.subtle }}
                >
                  {item.time}
                </span>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: DASH.muted }}>
                {item.meta}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
