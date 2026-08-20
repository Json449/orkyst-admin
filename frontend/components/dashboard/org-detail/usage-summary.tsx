import { ChevronDown } from "lucide-react";
import { DASH } from "../theme";
import type { OrgDetail } from "./detail-data";

export function UsageSummary({ detail }: { detail: OrgDetail }) {
  const stats = [
    { label: "Posts", value: detail.usage.posts },
    { label: "Images", value: detail.usage.images },
    { label: "Reels", value: detail.usage.reels },
    { label: "Calendars", value: detail.usage.calendars },
  ];

  return (
    <div
      className="flex h-full flex-col rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h2 className="text-[18px] font-bold" style={{ color: DASH.heading }}>
          Usage Summary
        </h2>
        <button
          className="flex shrink-0 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm transition-colors hover:bg-[#FAFAFB]"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          Last 30 days
          <ChevronDown className="h-4 w-4" style={{ color: DASH.muted }} />
        </button>
      </div>

      <div
        className="grid grid-cols-2 border-t sm:grid-cols-4"
        style={{ borderColor: DASH.border }}
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="px-6 py-7 text-center"
            style={
              index > 0
                ? { boxShadow: `inset 1px 0 0 0 ${DASH.border}` }
                : undefined
            }
          >
            <div
              className="text-[32px] font-bold leading-none"
              style={{ color: DASH.heading }}
            >
              {stat.value}
            </div>
            <div className="mt-2 text-[15px]" style={{ color: DASH.muted }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
