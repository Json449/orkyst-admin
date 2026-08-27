"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  FileText,
  ImageIcon,
  Mail,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Video,
} from "lucide-react";
import { DASH } from "@/components/dashboard/theme";
import { UserPlanPill, UserStatusPill } from "@/components/dashboard/users/user-pills";
import { type AdminUserDetail, fetchAdminUser } from "@/lib/api";

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

function initials(user: AdminUserDetail) {
  return (user.fullname || user.email)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function ProfileAvatar({ user, large = false }: { user: AdminUserDetail; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = user.avatar?.trim();
  const size = large ? "h-16 w-16 text-xl" : "h-10 w-10 text-xs";

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={`${user.fullname || user.email} profile picture`}
        onError={() => setImageFailed(true)}
        className={`${size} shrink-0 rounded-full border-2 border-white object-cover shadow-[0_5px_18px_rgba(33,8,57,0.22)]`}
      />
    );
  }

  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[#FFEAF7] font-bold text-[#9C1B76] shadow-[0_5px_18px_rgba(33,8,57,0.18)]`}>
      {initials(user)}
    </span>
  );
}

function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-white p-4 shadow-[0_8px_24px_rgba(31,24,38,0.025)] sm:p-5 ${className}`} style={{ borderColor: DASH.border }}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: DASH.heading }}>{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b py-2.5 first:pt-0 last:border-0 last:pb-0" style={{ borderColor: DASH.border }}>
      <span className="text-[12px]" style={{ color: DASH.muted }}>{label}</span>
      <span className="text-right text-[12px] font-semibold capitalize" style={{ color: DASH.heading }}>{value}</span>
    </div>
  );
}

function UsageCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof CalendarDays }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-b from-white to-[#FCFAFD] p-3.5" style={{ borderColor: DASH.border }}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1E9FF] text-[#7636D1]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-3 text-[25px] font-bold tracking-[-0.04em]" style={{ color: DASH.heading }}>{value}</div>
      <p className="mt-0.5 text-[12px]" style={{ color: DASH.muted }}>{label}</p>
      <p className="mt-3 text-[10px] font-medium" style={{ color: DASH.subtle }}>Recorded activity</p>
    </div>
  );
}

const platformStyle: Record<string, { label: string; tone: string; text: string }> = {
  facebook: { label: "f", tone: "#E7F0FF", text: "#1877F2" },
  instagram: { label: "◎", tone: "#FDE8F2", text: "#E1306C" },
  linkedin: { label: "in", tone: "#E4F1FB", text: "#0A66C2" },
  twitter: { label: "𝕏", tone: "#EEF1F4", text: "#17212B" },
  tiktok: { label: "♪", tone: "#F1F2F4", text: "#111827" },
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const load = (showLoading: boolean) => {
      if (inFlight) return;
      inFlight = true;
      if (showLoading) setLoading(true);
      setError("");
      fetchAdminUser(params.id)
        .then((result) => active && setUser(result))
        .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Unable to load user"))
        .finally(() => {
          inFlight = false;
          if (active && showLoading) setLoading(false);
        });
    };
    load(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load(false);
    }, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [params.id, reloadKey]);

  if (loading && !user) {
    return <div className="space-y-5"><div className="h-5 w-64 animate-pulse rounded bg-[#EDEAF0]" /><div className="h-28 animate-pulse rounded-2xl bg-white" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-white" /><div className="h-80 animate-pulse rounded-2xl bg-white" /></div></div>;
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: DASH.border }}>
        <p className="text-lg font-bold" style={{ color: DASH.heading }}>User could not be loaded</p>
        <p className="mt-2 text-sm" style={{ color: DASH.muted }}>{error || "User not found"}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard/users" className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: DASH.border, color: DASH.heading }}>Back to users</Link>
          <button onClick={() => setReloadKey((value) => value + 1)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: DASH.plum }}><RefreshCw className="h-4 w-4" /> Try again</button>
        </div>
      </div>
    );
  }

  const usage = [
    { label: "Calendars", value: user.activityCounts.calendars, icon: CalendarDays },
    { label: "Posts", value: user.activityCounts.posts, icon: FileText },
    { label: "Images", value: user.activityCounts.images, icon: ImageIcon },
    { label: "Reels", value: user.activityCounts.reels, icon: Video },
  ];
  const onboarding = [
    { label: "Account created", complete: true, date: user.createdAt },
    { label: "Email verified", complete: user.isVerified },
    { label: "Onboarding completed", complete: user.isOnboardingCompleted, date: user.onboardingCompletedAt },
    { label: "Social account connected", complete: user.connectedPlatforms.length > 0 },
    { label: "First calendar created", complete: user.activityCounts.calendars > 0 },
  ];
  const completedSteps = onboarding.filter((step) => step.complete).length;
  const onboardingPercent = Math.round((completedSteps / onboarding.length) * 100);
  const connectedPlatforms = new Set(user.connectedPlatforms.map((platform) => platform.toLowerCase()));
  const socialPlatforms = ["facebook", "instagram", "linkedin", "tiktok"];
  const contentMix = [
    { label: "Posts", value: user.activityCounts.posts, color: "#A21C6B" },
    { label: "Images", value: user.activityCounts.images, color: "#EC4899" },
    { label: "Reels", value: user.activityCounts.reels, color: "#7040D6" },
  ];
  const totalContent = contentMix.reduce((total, item) => total + item.value, 0);
  const contentPercentages = contentMix.map((item) =>
    totalContent ? Math.round((item.value / totalContent) * 100) : 0,
  );
  const postEnd = contentPercentages[0];
  const imageEnd = postEnd + contentPercentages[1];
  const contentRing = totalContent
    ? `conic-gradient(${contentMix[0].color} 0deg ${postEnd * 3.6}deg, ${contentMix[1].color} ${postEnd * 3.6}deg ${imageEnd * 3.6}deg, ${contentMix[2].color} ${imageEnd * 3.6}deg 360deg)`
    : "conic-gradient(#EEEAF4 0deg 360deg)";

  return (
    <div className="mx-auto max-w-[1400px] pb-8">
      <nav className="flex min-w-0 items-center gap-2 text-[14px]" style={{ color: DASH.muted }}>
        <Link href="/dashboard/users" className="hover:underline">Users</Link>
        <ChevronRight className="h-4 w-4" style={{ color: DASH.subtle }} />
        <span className="truncate">{user.fullname || user.email}</span>
      </nav>

      <section className="relative mt-4 overflow-hidden rounded-2xl bg-[linear-gradient(112deg,#45147f_0%,#790f79_52%,#b60c67_100%)] px-5 py-5 text-white shadow-[0_12px_32px_rgba(105,13,92,0.2)] sm:px-6">
        <span className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <span className="absolute bottom-0 left-1/3 h-24 w-72 rounded-full bg-[#e949ab]/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <ProfileAvatar user={user} large />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[24px] font-bold tracking-[-0.035em] sm:text-[26px]">{user.fullname || "Unnamed user"}</h1>
              <UserStatusPill status={user.status} />
              <UserPlanPill plan={user.plan} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-white/85">
              <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 hover:text-white hover:underline"><Mail className="h-3.5 w-3.5" />{user.email}</a>
              <span>Joined {formatDate(user.createdAt)}</span>
              <span>Last active {formatDate(user.lastLoginAt, true)}</span>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <Link href={`/dashboard/users/${user.id}/analytics`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#2A1631] shadow-sm transition hover:bg-[#FCFAFD] sm:flex-none">
              <BarChart3 className="h-4 w-4 text-[#6E3CCD]" />
              Analytics
            </Link>
            <button type="button" aria-label="More user actions" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white transition hover:bg-white/10">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(360px,1fr)]">
        <div className="space-y-4">
          <Panel title="Usage overview" action={<span className="rounded-xl border px-3 py-1.5 text-[11px] font-medium" style={{ borderColor: DASH.border, color: DASH.muted }}>Live account totals</span>}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {usage.map(({ label, value, icon }) => <UsageCard key={label} label={label} value={value} icon={icon} />)}
            </div>
          </Panel>

          <Panel title="Account information" action={<span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F0FF] text-[#7040D6]"><ShieldCheck className="h-3.5 w-3.5" /></span>}>
            <DetailRow label="Company" value={user.company || "Not provided"} />
            <DetailRow label="Sign-in provider" value={user.provider} />
            <DetailRow label="Billing provider" value={user.billingProvider} />
            <DetailRow label="Subscription" value={<span className="rounded-full bg-[#ECFDF5] px-2 py-1 text-[10px] font-bold normal-case text-[#059669]">{user.subscriptionStatus.replaceAll("_", " ")}</span>} />
            <DetailRow label="Period ends" value={formatDate(user.subscriptionCurrentPeriodEnd)} />
          </Panel>

        </div>

        <div className="space-y-4">
          <Panel title="Onboarding progress">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#7B3CCE ${onboardingPercent * 3.6}deg, #EEEAF4 0deg)` }}>
                <span className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-white">
                  <strong className="text-[23px] tracking-[-0.04em]" style={{ color: DASH.heading }}>{onboardingPercent}%</strong>
                  <span className="text-[10px]" style={{ color: DASH.muted }}>Complete</span>
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                {onboarding.map((step) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${step.complete ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#F1EFF4] text-[#9CA3AF]"}`}>{step.complete ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium" style={{ color: step.complete ? DASH.heading : DASH.muted }}>{step.label}</span>
                    {step.date && <span className="shrink-0 text-[11px]" style={{ color: DASH.subtle }}>{formatDate(step.date)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel
            title="Content activity"
            action={<Link href={`/dashboard/users/${user.id}/analytics`} className="text-[11px] font-semibold hover:underline" style={{ color: DASH.plum }}>View analytics</Link>}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: contentRing }}>
                <span className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-white">
                  <strong className="text-[23px] tracking-[-0.04em]" style={{ color: DASH.heading }}>{totalContent}</strong>
                  <span className="text-[10px]" style={{ color: DASH.muted }}>Generated</span>
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
                {contentMix.map((item, index) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="min-w-0 flex-1 text-[11px] font-medium" style={{ color: DASH.heading }}>{item.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: DASH.heading }}>{item.value}</span>
                    <span className="w-8 text-right text-[10px]" style={{ color: DASH.muted }}>{contentPercentages[index]}%</span>
                  </div>
                ))}
                <div className="border-t pt-2.5" style={{ borderColor: DASH.border }}>
                  <div className="flex items-center justify-between gap-3 text-[10px]" style={{ color: DASH.muted }}>
                    <span>Calendars created</span>
                    <strong className="text-[11px]" style={{ color: DASH.heading }}>{user.activityCounts.calendars}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Social connections">
            <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-y-0 sm:divide-x" style={{ borderColor: DASH.border }}>
              {socialPlatforms.map((platform) => {
                const style = platformStyle[platform];
                const connected = connectedPlatforms.has(platform);
                return (
                  <div key={platform} className="px-2 first:pl-0 last:pr-0">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold" style={{ backgroundColor: style.tone, color: style.text }}>{style.label}</span>
                      <strong className="text-base" style={{ color: DASH.heading }}>{connected ? 1 : 0}</strong>
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: connected ? DASH.muted : DASH.subtle }}>{connected ? "Connected" : "Not connected"}</p>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

    </div>
  );
}
