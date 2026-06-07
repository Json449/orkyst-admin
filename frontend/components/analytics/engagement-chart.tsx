"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const engagementData = [
  { date: "Jan 1", impressions: 4200, engagement: 1800 },
  { date: "Jan 8", impressions: 5100, engagement: 2100 },
  { date: "Jan 15", impressions: 4800, engagement: 1900 },
  { date: "Jan 22", impressions: 6200, engagement: 2600 },
  { date: "Jan 29", impressions: 7100, engagement: 3100 },
  { date: "Feb 5", impressions: 6800, engagement: 2900 },
  { date: "Feb 12", impressions: 8500, engagement: 3600 },
]

export function EngagementChart() {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Engagement Trends</CardTitle>
            <p className="text-sm text-muted-foreground">Impressions vs engagement over time</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6B2D5B]" />
              <span className="text-xs text-muted-foreground">Impressions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7c3aed]" />
              <span className="text-xs text-muted-foreground">Engagement</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B2D5B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6B2D5B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="#6B2D5B"
                strokeWidth={2}
                fill="url(#impressionsGradient)"
                name="Impressions"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#engagementGradient)"
                name="Engagement"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
