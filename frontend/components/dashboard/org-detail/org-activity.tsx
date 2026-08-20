import { DASH } from "../theme";
import type { ActivityTone, OrgDetail } from "./detail-data";

const TONE_COLORS: Record<ActivityTone, string> = {
  success: "#10B981",
  info: "#2563EB",
  warning: "#D97706",
  brand: "#8A1253",
};

export function OrgActivity({ detail }: { detail: OrgDetail }) {
  return (
    <div className="rounded-2xl border bg-white" style={{ borderColor: DASH.border }}>
      <div
        className="flex items-center justify-between gap-4 border-b px-6 py-5"
        style={{ borderColor: DASH.border }}
      >
        <h2 className="text-[18px] font-bold" style={{ color: DASH.heading }}>
          Recent Activity
        </h2>
        <button
          className="shrink-0 text-[15px] font-bold hover:underline"
          style={{ color: DASH.accent }}
        >
          View full activity →
        </button>
      </div>

      {detail.activity.length === 0 ? (
        <p className="px-6 py-10 text-center text-[15px]" style={{ color: DASH.subtle }}>
          No activity recorded yet.
        </p>
      ) : (
        <ol className="relative px-6 py-6">
          <span
            className="absolute bottom-10 left-[29px] top-10 w-px"
            style={{ backgroundColor: DASH.border }}
            aria-hidden
          />
          {detail.activity.map((item) => (
            <li key={item.title} className="relative flex gap-4 pb-7 last:pb-0">
              <span
                className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white"
                style={{ backgroundColor: TONE_COLORS[item.tone] }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[16px] font-bold" style={{ color: DASH.heading }}>
                    {item.title}
                  </p>
                  <span
                    className="shrink-0 whitespace-nowrap text-[14px]"
                    style={{ color: DASH.subtle }}
                  >
                    {item.time}
                  </span>
                </div>
                <p className="mt-1 text-[15px]" style={{ color: DASH.muted }}>
                  {item.meta}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
