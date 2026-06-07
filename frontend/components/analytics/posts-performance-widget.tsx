"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileText, Linkedin, Instagram, Twitter } from "lucide-react";
import { fetchPosts, type PostsData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const PlatformIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, React.ReactNode> = {
    linkedin:  <Linkedin  className="h-3.5 w-3.5 text-[#0A66C2]" />,
    instagram: <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />,
    twitter:   <Twitter   className="h-3.5 w-3.5 text-[#1DA1F2]" />,
  };
  return <>{icons[platform] ?? null}</>;
};

export function PostsPerformanceWidget() {
  const [data, setData] = useState<PostsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Post Performance</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Engagement Trend */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.engagementTrend ?? []}>
                    <defs>
                      <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6B2D5B" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6B2D5B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="engagementsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4A9B8C" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#4A9B8C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg bg-card p-3 shadow-lg border border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                              <p className="text-sm">
                                <span className="text-[#6B2D5B] font-medium">
                                  {payload[0].value?.toLocaleString()}
                                </span>{" "}
                                impressions
                              </p>
                              <p className="text-sm">
                                <span className="text-[#4A9B8C] font-medium">
                                  {payload[1]?.value?.toLocaleString()}
                                </span>{" "}
                                engagements
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stroke="#6B2D5B"
                      strokeWidth={2}
                      fill="url(#impressionsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="engagements"
                      stroke="#4A9B8C"
                      strokeWidth={2}
                      fill="url(#engagementsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#6B2D5B]" />
                <span className="text-xs text-muted-foreground">Impressions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#4A9B8C]" />
                <span className="text-xs text-muted-foreground">Engagements</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.platformDistribution ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(data?.platformDistribution ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(data?.platformDistribution ?? []).map((platform) => (
                <div key={platform.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: platform.color }} />
                  <span className="text-xs text-muted-foreground">{platform.name}</span>
                  <span className="text-xs font-medium ml-auto">{platform.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts Table */}
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.topPosts ?? []).map((post, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
                      <PlatformIcon platform={post.platform} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.title}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {post.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.impressions}</p>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.engagements}</p>
                      <p className="text-xs text-muted-foreground">Engagements</p>
                    </div>
                    <div className="w-16">
                      <p className="text-sm font-medium text-green-600">{post.engagementRate}</p>
                      <p className="text-xs text-muted-foreground">Rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
