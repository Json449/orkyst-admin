"use client";

import { DASH } from "./theme";

const CONTENT = [
  { label: "Posts", value: 2841, color: "#2563EB" },
  { label: "Images", value: 1920, color: "#F97316" },
  { label: "Reels", value: 438, color: "#10B981" },
  { label: "Calendars", value: 186, color: "#F59E0B" },
];

const TOTAL = CONTENT.reduce((sum, row) => sum + row.value, 0);
const MAX = Math.max(...CONTENT.map((row) => row.value));

export function ContentGeneratedCard() {
  return (
    <div
      className="flex h-full flex-col rounded-2xl border bg-white p-6"
      style={{ borderColor: DASH.border }}
    >
      <h2 className="text-lg font-bold" style={{ color: DASH.heading }}>
        Content Generated
      </h2>

      <div className="mt-6 space-y-5">
        {CONTENT.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: row.color }}
            />
            <span
              className="w-20 shrink-0 text-sm font-semibold"
              style={{ color: DASH.heading }}
            >
              {row.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EFEDF2]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.value / MAX) * 100}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
            <span
              className="w-14 shrink-0 text-right text-sm font-bold"
              style={{ color: DASH.heading }}
            >
              {row.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-auto border-t pt-5 text-sm"
        style={{ borderColor: DASH.border, color: DASH.muted }}
      >
        <span className="font-bold" style={{ color: DASH.heading }}>
          {TOTAL.toLocaleString()}
        </span>{" "}
        assets generated in the last 30 days
      </div>
    </div>
  );
}
