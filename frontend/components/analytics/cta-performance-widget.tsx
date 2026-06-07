"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { MousePointerClick, ExternalLink, Users, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchCTA, type CTAData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const METRIC_CONFIG: Array<{
  key: keyof CTAData["metrics"];
  label: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}> = [
  { key: "totalLinkClicks", label: "Total Link Clicks", icon: MousePointerClick, bgColor: "bg-primary/10", iconColor: "text-primary" },
  { key: "siteVisits",      label: "Site Visits",       icon: ExternalLink,      bgColor: "bg-purple-100",  iconColor: "text-purple-600" },
  { key: "newAudience",     label: "New Audience",      icon: Users,             bgColor: "bg-teal-100",    iconColor: "text-teal-600" },
  { key: "avgCtr",          label: "Avg. CTR",          icon: TrendingUp,        bgColor: "bg-blue-100",    iconColor: "text-blue-600" },
];

export function CTAPerformanceWidget() {
  const [data, setData] = useState<CTAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCTA().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <MousePointerClick className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">CTA Performance</h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRIC_CONFIG.map(({ key, label, icon: Icon, bgColor, iconColor }) => (
          <Card key={key} className="shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {loading ? (
                    <>
                      <Skeleton className="h-7 w-20" />
                      <Skeleton className="h-3 w-28 mt-1" />
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground">{data?.metrics[key].value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </>
                  )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {loading ? (
                  <Skeleton className="h-3 w-16" />
                ) : (
                  <>
                    <span className="text-xs font-medium text-green-600">{data?.metrics[key].change}</span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Breakdown Chart */}
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clicks by Content Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.clicksByContentType ?? []} layout="vertical" barCategoryGap="20%">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg bg-card p-2 shadow-lg border border-border">
                            <p className="text-sm font-medium">{payload[0].payload.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {payload[0].value?.toLocaleString()} clicks
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payload[0].payload.ctr}% CTR
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    fill="#6B2D5B"
                    radius={[0, 4, 4, 0]}
                    background={{ fill: "#F3F4F6", radius: 4 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
