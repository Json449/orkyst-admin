"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MousePointer2,
  PlaySquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OrkystLogo } from "@/components/orkyst-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrkystLoader } from "@/components/ui/orkyst-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminUserStats, logout, type AdminUserStatsData } from "@/lib/api";

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

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const formatAxisDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const ACTIVITY_COLORS = ["#6B2D5B", "#0F766E", "#2563EB", "#C2410C", "#7C3AED"];

const activityIcon = (kind: string) => {
  if (kind === "user_signup") return Users;
  if (kind === "calendar_created") return CalendarDays;
  if (kind === "event_created") return MousePointer2;
  return Activity;
};

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

function SignupFrequencyChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const minDate = toDateInputValue(data[0]?.date);
  const maxDate = toDateInputValue(data[data.length - 1]?.date);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const day = toDateInputValue(item.date);
      if (startDate && day < startDate) return false;
      if (endDate && day > endDate) return false;
      return true;
    });
  }, [data, endDate, startDate]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <CardTitle className="text-base font-semibold">Signup Frequency</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="signup-start" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="signup-start"
                type="date"
                min={minDate}
                max={endDate || maxDate}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-9 w-full min-w-0 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="signup-end" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="signup-end"
                type="date"
                min={startDate || minDate}
                max={maxDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-9 w-full min-w-0 text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {filteredData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 8, right: 16, bottom: 28, left: 8 }}
                barCategoryGap="24%"
              >
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  label={{
                    value: "Date",
                    position: "insideBottom",
                    offset: -14,
                    fill: "#6B7280",
                    fontSize: 12,
                  }}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(1, dataMax)]}
                  label={{
                    value: "Signup count",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#6B7280",
                    fontSize: 12,
                  }}
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
                          {payload[0].value} signups
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6B2D5B"
                  maxBarSize={42}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              No signups in this date range
            </div>
          )}
        </div>
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

function ActivityDonutCard({ data }: { data: AdminUserStatsData }) {
  const chartData = [
    { name: "Calendars", value: data.activityTotals.calendars },
    { name: "Events", value: data.eventStats.totalEvents },
    { name: "Posts", value: data.activityTotals.posts },
    { name: "Images", value: data.activityTotals.images },
    { name: "Reels", value: data.activityTotals.reels },
  ].filter((item) => item.value > 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Orkyst Activity Mix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-72">
          {chartData.length ? (
            <div className="grid min-h-72 gap-4 md:grid-cols-[0.78fr_1fr] md:items-center">
              <div className="space-y-3">
                {chartData.map((item, index) => {
                  const percent = total ? Math.round((item.value / total) * 100) : 0;
                  const color = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];

                  return (
                    <div
                      key={item.name}
                      className="rounded-lg border border-border bg-background/60 px-3 py-2"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{percent}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{item.value} total</span>
                        <span>{total} all activity</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${percent}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0];
                        const value = Number(item.value ?? 0);
                        return (
                          <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {value} total · {total ? Math.round((value / total) * 100) : 0}%
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              No product activity yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ items }: { items: AdminUserStatsData["recentActivity"] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length ? (
          <div className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.map((item) => {
              const Icon = activityIcon(item.kind);
              return (
                <div key={item.id} className="flex gap-3 px-5 py-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.label}
                      {item.email ? ` · ${item.email}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">{label(item.metadata)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No recent activity found
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminLoading() {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <OrkystLoader label="Loading admin analytics" />
        </CardContent>
      </Card>
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
  const router = useRouter();
  const [data, setData] = useState<AdminUserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminUserStats()
      .then(setData)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load admin stats";
        if (message.toLowerCase().includes("sign in")) {
          router.replace("/login");
          return;
        }
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    router.replace("/login");
  };

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
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
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
              <SignupFrequencyChart data={data.signupTrend} />
              <ActivityDonutCard data={data} />
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

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <TrendChart title="Onboarding Completed" data={data.onboardingTrend} color="#0F766E" />
              <RecentActivityCard items={data.recentActivity} />
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard
                title="Events"
                value={data.eventStats.totalEvents}
                helper={`${data.eventStats.approvedEvents} approved`}
                icon={MousePointer2}
              />
              <MetricCard
                title="Posted"
                value={data.eventStats.postedEvents}
                helper="Published social events"
                icon={CheckCircle2}
              />
              <MetricCard
                title="Scheduled"
                value={data.eventStats.scheduledEvents}
                helper="Queued for posting"
                icon={Clock3}
              />
              <MetricCard
                title="Failed"
                value={data.eventStats.failedEvents}
                helper="Posting attempts needing review"
                icon={Activity}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <BreakdownCard title="Signup Provider" items={data.providerBreakdown} />
              <BreakdownCard title="Event Status" items={data.eventStatusBreakdown} />
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
