"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  BookOpen,
  Link2,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MousePointerClick,
  Globe,
  Eye,
} from "lucide-react";

// Content that drives traffic - tracked automatically
const contentTraffic = [
  {
    id: 1,
    title: "How to Scale Your Marketing Team",
    type: "blog",
    platform: "Website",
    clicks: 3420,
    visitors: 2891,
    newFollowers: 156,
    trend: "up",
    trendValue: 23,
  },
  {
    id: 2,
    title: "Customer Success Story: Acme Corp",
    type: "case-study",
    platform: "LinkedIn",
    clicks: 1847,
    visitors: 1534,
    newFollowers: 89,
    trend: "up",
    trendValue: 45,
  },
  {
    id: 3,
    title: "Product Launch Announcement",
    type: "social",
    platform: "Twitter",
    clicks: 5621,
    visitors: 4102,
    newFollowers: 312,
    trend: "down",
    trendValue: 12,
  },
  {
    id: 4,
    title: "Feature in TechCrunch",
    type: "external",
    platform: "TechCrunch",
    clicks: 8934,
    visitors: 7123,
    newFollowers: 521,
    trend: "up",
    trendValue: 89,
  },
  {
    id: 5,
    title: "2024 Marketing Trends Report",
    type: "blog",
    platform: "Website",
    clicks: 2156,
    visitors: 1845,
    newFollowers: 203,
    trend: "stable",
    trendValue: 2,
  },
];

const typeConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  blog: {
    icon: <FileText className="h-4 w-4" />,
    label: "Blog",
    color: "bg-blue-100 text-blue-700",
  },
  "case-study": {
    icon: <BookOpen className="h-4 w-4" />,
    label: "Case Study",
    color: "bg-[#6B2D5B]/10 text-[#6B2D5B]",
  },
  social: {
    icon: <Link2 className="h-4 w-4" />,
    label: "Social",
    color: "bg-purple-100 text-purple-700",
  },
  external: {
    icon: <Newspaper className="h-4 w-4" />,
    label: "External",
    color: "bg-amber-100 text-amber-700",
  },
};

// Channel performance without dollar metrics
const channelPerformance = [
  { 
    channel: "Blogs", 
    clicks: 5576, 
    visitors: 4736, 
    audienceGrowth: 359,
    engagementRate: 4.2,
  },
  { 
    channel: "Case Studies", 
    clicks: 1847, 
    visitors: 1534, 
    audienceGrowth: 89,
    engagementRate: 6.8,
  },
  { 
    channel: "Social Posts", 
    clicks: 5621, 
    visitors: 4102, 
    audienceGrowth: 312,
    engagementRate: 5.1,
  },
  { 
    channel: "External Media", 
    clicks: 8934, 
    visitors: 7123, 
    audienceGrowth: 521,
    engagementRate: 3.9,
  },
];

export function ContentAttribution() {
  const maxClicks = Math.max(...contentTraffic.map((c) => c.clicks));
  const maxChannelClicks = Math.max(...channelPerformance.map((c) => c.clicks));
  
  const totalClicks = channelPerformance.reduce((sum, c) => sum + c.clicks, 0);
  const totalVisitors = channelPerformance.reduce((sum, c) => sum + c.visitors, 0);
  const totalAudienceGrowth = channelPerformance.reduce((sum, c) => sum + c.audienceGrowth, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Content Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Top Content by Traffic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contentTraffic.map((content) => {
              const config = typeConfig[content.type];
              const clickPercent = (content.clicks / maxClicks) * 100;

              return (
                <div key={content.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {content.title}
                        </p>
                        {content.trend === "up" && (
                          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        )}
                        {content.trend === "down" && (
                          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}
                        {content.trend === "stable" && (
                          <Minus className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${config.color}`}
                        >
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {content.platform}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#6B2D5B]">
                        {content.clicks.toLocaleString()} clicks
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{content.newFollowers} followers
                      </p>
                    </div>
                  </div>
                  <Progress value={clickPercent} className="h-1.5 bg-muted" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Channel Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Channel Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {channelPerformance.map((channel) => {
              const clickPercent = (channel.clicks / maxChannelClicks) * 100;

              return (
                <div key={channel.channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {channel.channel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {channel.engagementRate}% engagement rate
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#6B2D5B]">
                        {channel.clicks.toLocaleString()} clicks
                      </p>
                      <p className="text-xs text-green-600">
                        +{channel.audienceGrowth} new followers
                      </p>
                    </div>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="rounded-full bg-gradient-to-r from-[#6B2D5B] to-[#8B4D7B] transition-all"
                      style={{ width: `${clickPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 rounded-lg bg-[#6B2D5B]/5 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                  <MousePointerClick className="h-4 w-4" />
                  <span className="text-xs">Total Clicks</span>
                </div>
                <p className="mt-1 text-lg font-bold text-[#6B2D5B]">
                  {totalClicks.toLocaleString()}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs">Site Visitors</span>
                </div>
                <p className="mt-1 text-lg font-bold text-[#6B2D5B]">
                  {totalVisitors.toLocaleString()}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Audience Growth</span>
                </div>
                <p className="mt-1 text-lg font-bold text-green-600">
                  +{totalAudienceGrowth.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
