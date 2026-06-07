"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  LayoutDashboard,
  PlaySquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OrkystLogo } from "@/components/orkyst-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminUserStats, type AdminUserStatsData } from "@/lib/api";

const formatDate = (value?: string) => {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const label = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: typeof Users;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function TrendChart({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ date: string; count: number }>;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                        <p className="text-sm font-medium">
                          {formatDate(payload[0].payload.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].value} users
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              No activity in this period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  items,
  nameKey = "name",
}: {
  title: string;
  items: Array<{ name?: string; platform?: string; count: number }>;
  nameKey?: "name" | "platform";
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const name = item[nameKey] ?? "unknown";
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{label(name)}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-4 h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export default function AdminUserStatsPage() {
  const [data, setData] = useState<AdminUserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminUserStats()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load admin stats"))
      .finally(() => setLoading(false));
  }, []);

  const activeConnectedUsers = useMemo(() => {
    return data?.recentUsers.filter((user) => user.connectedPlatforms.length > 0).length ?? 0;
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-primary">
                <OrkystLogo className="h-9 w-9" />
              </div>
              <span className="text-xl font-semibold text-foreground">orkyst</span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/"
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Analytics
              </Link>
              <Link
                href="/admin"
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin User Stats</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              User-base, onboarding, signup, platform connection, and activity data
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            {data ? `${data.lookbackDays} day window · ${label(data.source)} data` : "Loading"}
          </div>
        </div>

        {loading ? (
          <AdminLoading />
        ) : error || !data ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-sm text-destructive">
              {error || "No admin data returned"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Users"
                value={data.totals.totalUsers}
                helper={`${data.totals.verifiedUsers} verified (${data.totals.verificationRatePct}%)`}
                icon={Users}
              />
              <MetricCard
                title="Onboarded"
                value={data.totals.onboardedUsers}
                helper={`${data.totals.onboardingRatePct}% onboarding completion`}
                icon={CheckCircle2}
              />
              <MetricCard
                title="Active Users"
                value={data.totals.activeUsers30d}
                helper={`${data.totals.activeRate30dPct}% signed in recently`}
                icon={Activity}
              />
              <MetricCard
                title="Recent Connected"
                value={activeConnectedUsers}
                helper="Recent users with social accounts connected"
                icon={ShieldCheck}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <TrendChart title="Signup Frequency" data={data.signupTrend} color="#6B2D5B" />
              <TrendChart title="Onboarding Completed" data={data.onboardingTrend} color="#0F766E" />
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard
                title="Calendars"
                value={data.activityTotals.calendars}
                helper="Generated by users"
                icon={CalendarDays}
              />
              <MetricCard
                title="Posts"
                value={data.activityTotals.posts}
                helper="Social content created"
                icon={LayoutDashboard}
              />
              <MetricCard
                title="Images"
                value={data.activityTotals.images}
                helper="Creative assets generated"
                icon={ImageIcon}
              />
              <MetricCard
                title="Reels"
                value={data.activityTotals.reels}
                helper="Video assets generated"
                icon={PlaySquare}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <BreakdownCard title="Signup Provider" items={data.providerBreakdown} />
              <BreakdownCard title="Plan Mix" items={data.planBreakdown} />
              <BreakdownCard
                title="Connected Platforms"
                items={data.socialConnections}
                nameKey="platform"
              />
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Recent Users</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-semibold">User</th>
                        <th className="px-5 py-3 font-semibold">Provider</th>
                        <th className="px-5 py-3 font-semibold">Plan</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Platforms</th>
                        <th className="px-5 py-3 font-semibold">Activity</th>
                        <th className="px-5 py-3 font-semibold">Signup</th>
                        <th className="px-5 py-3 font-semibold">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.recentUsers.map((user) => (
                        <tr key={user.id} className="align-top">
                          <td className="px-5 py-4">
                            <div className="font-medium text-foreground">
                              {user.fullname || "Unnamed user"}
                            </div>
                            <div className="mt-1 text-muted-foreground">{user.email}</div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {label(user.provider)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-foreground">{label(user.plan)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {label(user.billingProvider)} · {label(user.subscriptionStatus)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {user.isVerified ? "Verified" : "Unverified"}
                              </span>
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.isOnboardingCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {user.isOnboardingCompleted ? "Onboarded" : "Pending"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {user.connectedPlatforms.length ? (
                                user.connectedPlatforms.map((platform) => (
                                  <span
                                    key={`${user.id}-${platform}`}
                                    className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                                  >
                                    {label(platform)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {user.activityCounts.posts} posts · {user.activityCounts.images} images
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {formatDate(user.lastLoginAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
