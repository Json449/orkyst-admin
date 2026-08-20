"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { DASH, LINE_BLUE } from "./theme";

const GROWTH_DATA = [
  { date: "Jul 14", users: 61 },
  { date: "Jul 16", users: 63 },
  { date: "Jul 18", users: 65 },
  { date: "Jul 20", users: 68 },
  { date: "Jul 22", users: 71 },
  { date: "Jul 24", users: 75 },
  { date: "Jul 26", users: 76 },
  { date: "Jul 28", users: 78 },
  { date: "Jul 30", users: 81 },
  { date: "Aug 1", users: 85 },
  { date: "Aug 3", users: 87 },
  { date: "Aug 5", users: 89 },
  { date: "Aug 7", users: 92 },
  { date: "Aug 9", users: 95 },
  { date: "Aug 11", users: 97 },
  { date: "Aug 12", users: 98 },
];

export function UserGrowthCard() {
  return (
    <div
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: DASH.border }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: DASH.heading }}>
            User Growth
          </h2>
          <p className="mt-1 text-sm" style={{ color: DASH.muted }}>
            Cumulative users · last 30 days
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold"
          style={{ backgroundColor: DASH.pink, color: DASH.plum }}
        >
          +35 this period
        </span>
      </div>

      <div className="mt-6 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={GROWTH_DATA} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LINE_BLUE} stopOpacity={0.18} />
                <stop offset="100%" stopColor={LINE_BLUE} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F1F0F4" />
            <XAxis
              dataKey="date"
              ticks={["Jul 14", "Jul 30", "Aug 12"]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: DASH.subtle, fontSize: 12 }}
              dy={8}
            />
            <YAxis
              domain={[60, 100]}
              ticks={[60, 70, 80, 90, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: DASH.subtle, fontSize: 12 }}
              width={40}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke={LINE_BLUE}
              strokeWidth={2}
              fill="url(#userGrowthFill)"
              dot={false}
              activeDot={{ r: 4, fill: LINE_BLUE, stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
