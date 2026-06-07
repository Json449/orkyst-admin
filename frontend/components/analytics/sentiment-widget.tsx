"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { SmilePlus, Smile, Frown, TrendingUp, TrendingDown } from "lucide-react";
import { fetchSentiment, type SentimentData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function SentimentWidget() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiment().then(setData).finally(() => setLoading(false));
  }, []);

  const positivePct = data?.positivePct ?? 0;
  const trendUp = (data?.trendDeltaPct ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <SmilePlus className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Sentiment Analysis</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Overall Sentiment Donut */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.sentimentData ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(data?.sentimentData ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-foreground">{positivePct}%</p>
                  <p className="text-xs text-muted-foreground">Positive</p>
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-4">
              {(data?.sentimentData ?? []).map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sentiment by Platform */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sentiment by Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.byPlatform ?? []} layout="vertical" barCategoryGap="15%">
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="platform"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      width={70}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-card p-2 shadow-lg border border-border">
                              <p className="text-xs font-medium mb-1">{d.platform}</p>
                              <p className="text-xs text-green-600">Positive: {d.positive}%</p>
                              <p className="text-xs text-gray-500">Neutral: {d.neutral}%</p>
                              <p className="text-xs text-red-500">Negative: {d.negative}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="positive" stackId="a" fill="#22C55E" />
                    <Bar dataKey="neutral"  stackId="a" fill="#D1D5DB" />
                    <Bar dataKey="negative" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /><span className="text-xs text-muted-foreground">Positive</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-300" /><span className="text-xs text-muted-foreground">Neutral</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /><span className="text-xs text-muted-foreground">Negative</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords & Trends */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trending Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Smile className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-medium text-green-600">Positive mentions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.keywords.positive ?? []).map((word) => (
                      <span key={word} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Frown className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-600">Areas to improve</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.keywords.negative ?? []).map((word) => (
                      <span key={word} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Sentiment trend</span>
                    <div className={`flex items-center gap-1 ${trendUp ? "text-green-600" : "text-red-500"}`}>
                      {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      <span className="text-xs font-medium">{data?.trendLabel}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on {(data?.totalAnalyzed ?? 0).toLocaleString()} analyzed responses
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
