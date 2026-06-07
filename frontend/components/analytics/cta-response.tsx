"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MousePointerClick,
  ExternalLink,
  FileText,
  TrendingUp,
  Users,
  ArrowRight,
  Globe,
  BookOpen,
  Newspaper,
  Link2,
  Eye,
  UserPlus,
} from "lucide-react";

// Surface-level metrics - no payment/CRM integration needed
// All tracked via Orkyst's auto-generated UTM links
const linkPerformance = [
  {
    id: 1,
    linkName: "Product Page",
    source: "LinkedIn Case Study",
    sourceType: "case-study",
    clicks: 847,
    uniqueVisitors: 623,
    avgTimeOnPage: "2m 34s",
    bounceRate: 32,
  },
  {
    id: 2,
    linkName: "Blog: Marketing Guide",
    source: "Twitter Thread",
    sourceType: "social",
    clicks: 1243,
    uniqueVisitors: 891,
    avgTimeOnPage: "4m 12s",
    bounceRate: 24,
  },
  {
    id: 3,
    linkName: "Free Resource Download",
    source: "Instagram Bio",
    sourceType: "social",
    clicks: 562,
    uniqueVisitors: 498,
    avgTimeOnPage: "1m 45s",
    bounceRate: 18,
  },
  {
    id: 4,
    linkName: "Contact Page",
    source: "Blog Footer CTA",
    sourceType: "blog",
    clicks: 389,
    uniqueVisitors: 312,
    avgTimeOnPage: "3m 08s",
    bounceRate: 41,
  },
  {
    id: 5,
    linkName: "Pricing Page",
    source: "Newsletter",
    sourceType: "external",
    clicks: 721,
    uniqueVisitors: 534,
    avgTimeOnPage: "2m 56s",
    bounceRate: 28,
  },
];

const trafficFunnel = {
  impressions: 248500,
  engagements: 18420,
  linkClicks: 5742,
  siteVisits: 4218,
  newAudience: 1847,
};

const sourceTypeIcons: Record<string, React.ReactNode> = {
  "case-study": <BookOpen className="h-3.5 w-3.5" />,
  blog: <FileText className="h-3.5 w-3.5" />,
  social: <Link2 className="h-3.5 w-3.5" />,
  external: <Newspaper className="h-3.5 w-3.5" />,
};

const sourceTypeColors: Record<string, string> = {
  "case-study": "bg-[#6B2D5B]/10 text-[#6B2D5B]",
  blog: "bg-blue-50 text-blue-700",
  social: "bg-purple-50 text-purple-700",
  external: "bg-amber-50 text-amber-700",
};

export function CTAResponse() {
  const funnelSteps = [
    { label: "Impressions", value: trafficFunnel.impressions, icon: Eye },
    { label: "Engagements", value: trafficFunnel.engagements, icon: TrendingUp },
    { label: "Link Clicks", value: trafficFunnel.linkClicks, icon: MousePointerClick },
    { label: "Site Visits", value: trafficFunnel.siteVisits, icon: ExternalLink },
    { label: "New Audience", value: trafficFunnel.newAudience, icon: UserPlus },
  ];

  const maxClicks = Math.max(...linkPerformance.map((l) => l.clicks));

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6B2D5B]/10">
                <MousePointerClick className="h-5 w-5 text-[#6B2D5B]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
                <p className="text-xl font-semibold text-foreground">
                  {trafficFunnel.linkClicks.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Site Visits</p>
                <p className="text-xl font-semibold text-foreground">
                  {trafficFunnel.siteVisits.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Click Rate</p>
                <p className="text-xl font-semibold text-foreground">
                  {((trafficFunnel.linkClicks / trafficFunnel.impressions) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <UserPlus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Audience</p>
                <p className="text-xl font-semibold text-foreground">
                  +{trafficFunnel.newAudience.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Funnel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              Traffic Funnel
            </CardTitle>
            <Badge variant="secondary" className="bg-[#6B2D5B]/10 text-[#6B2D5B]">
              Auto-tracked via UTM
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {funnelSteps.map((step, index) => {
              const Icon = step.icon;
              const percentage =
                index === 0
                  ? 100
                  : ((step.value / funnelSteps[0].value) * 100).toFixed(1);
              const dropoff =
                index === 0
                  ? null
                  : (
                      ((funnelSteps[index - 1].value - step.value) /
                        funnelSteps[index - 1].value) *
                      100
                    ).toFixed(0);

              return (
                <div key={step.label} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center">
                    <div
                      className="mb-2 flex h-12 w-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `rgba(107, 45, 91, ${0.08 + (1 - index * 0.15) * 0.12})`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{
                          color: `rgba(107, 45, 91, ${0.5 + (1 - index * 0.08)})`,
                        }}
                      />
                    </div>
                    <p className="text-center text-xs font-medium text-muted-foreground">
                      {step.label}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {step.value >= 1000
                        ? `${(step.value / 1000).toFixed(1)}K`
                        : step.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{percentage}%</p>
                    {dropoff && Number(dropoff) > 0 && (
                      <p className="mt-1 text-xs text-orange-500">-{dropoff}%</p>
                    )}
                  </div>
                  {index < funnelSteps.length - 1 && (
                    <ArrowRight className="mx-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Link Performance Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Link Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {linkPerformance.map((link) => {
              const clickPercent = (link.clicks / maxClicks) * 100;

              return (
                <div key={link.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {link.linkName}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${sourceTypeColors[link.sourceType]}`}
                        >
                          <span className="mr-1">{sourceTypeIcons[link.sourceType]}</span>
                          {link.sourceType === "case-study"
                            ? "Case Study"
                            : link.sourceType === "blog"
                              ? "Blog"
                              : link.sourceType === "social"
                                ? "Social"
                                : "External"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Source: {link.source}
                      </p>
                    </div>

                    <div className="flex items-center gap-5 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-semibold text-[#6B2D5B]">
                          {link.clicks.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Visitors</p>
                        <p className="font-medium text-foreground">
                          {link.uniqueVisitors.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Time</p>
                        <p className="font-medium text-foreground">
                          {link.avgTimeOnPage}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bounce</p>
                        <p
                          className={`font-medium ${
                            link.bounceRate < 25
                              ? "text-green-600"
                              : link.bounceRate < 35
                                ? "text-amber-600"
                                : "text-red-500"
                          }`}
                        >
                          {link.bounceRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={clickPercent}
                    className="h-1.5 bg-muted"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
