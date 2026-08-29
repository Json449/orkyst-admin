"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  RefreshCw,
  Video,
  XCircle,
} from "lucide-react";
import { DASH } from "@/components/dashboard/theme";
import { fetchAdminUserActivityDetail } from "@/lib/api";

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

function plainText(value?: string | null) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b py-3 last:border-b-0" style={{ borderColor: DASH.border }}>
      <p className="text-[11px] font-semibold uppercase" style={{ color: DASH.subtle }}>{label}</p>
      <div className="mt-1 text-[13px] font-semibold" style={{ color: DASH.heading }}>{value}</div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  if (!value) return null;
  return (
    <section className="rounded-xl border bg-white p-4" style={{ borderColor: DASH.border }}>
      <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>{title}</h2>
      <pre className="mt-3 max-h-[360px] overflow-auto rounded-lg bg-[#17121A] p-3 text-[11px] leading-5 text-white">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

export default function ActivityDetailPage() {
  const params = useParams<{ id: string; activityId: string }>();
  const activityQuery = useQuery({
    queryKey: ["admin", "user", params.id, "activity", params.activityId],
    queryFn: () => fetchAdminUserActivityDetail(params.id, params.activityId),
  });
  const detail = activityQuery.data;
  const loading = activityQuery.isLoading;
  const error = activityQuery.error instanceof Error ? activityQuery.error.message : "Unable to load activity";

  const description = useMemo(() => plainText(detail?.event?.description || detail?.description), [detail]);

  if (loading && !detail) {
    return <div className="space-y-4"><div className="h-8 w-72 animate-pulse rounded bg-[#EDEAF0]" /><div className="h-64 animate-pulse rounded-xl bg-white" /><div className="grid gap-4 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-xl bg-white" /><div className="h-80 animate-pulse rounded-xl bg-white" /></div></div>;
  }

  if (activityQuery.isError || !detail) {
    return (
      <div className="rounded-xl border bg-white px-6 py-16 text-center" style={{ borderColor: DASH.border }}>
        <p className="text-lg font-bold" style={{ color: DASH.heading }}>Activity could not be loaded</p>
        <p className="mt-2 text-sm" style={{ color: DASH.muted }}>{error || "Activity not found"}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/dashboard/users/${params.id}/analytics`} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: DASH.border, color: DASH.heading }}>Back to analytics</Link>
          <button onClick={() => activityQuery.refetch()} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: DASH.plum }}><RefreshCw className="h-4 w-4" /> Try again</button>
        </div>
      </div>
    );
  }

  const event = detail.event;
  const approved = event?.isApproved;
  const mediaUrl = event?.artwork || null;
  const reelUrl = event?.reelUrl || null;

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/dashboard/users/${params.id}/analytics`} className="inline-flex items-center gap-2 text-[13px] font-bold hover:underline" style={{ color: DASH.plum }}>
          <ArrowLeft className="h-4 w-4" />
          Activity timeline
        </Link>
        <span className="rounded-full bg-[#F8EAF4] px-3 py-1 text-[11px] font-bold" style={{ color: DASH.plum }}>{detail.label}</span>
      </div>

      <section className="rounded-xl border bg-white p-5" style={{ borderColor: DASH.border }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold" style={{ color: DASH.muted }}>{detail.user.fullname || detail.user.email}</p>
            <h1 className="mt-1 text-[24px] font-bold tracking-tight" style={{ color: DASH.heading }}>{detail.title}</h1>
            <p className="mt-2 max-w-4xl text-[13px] leading-6" style={{ color: DASH.muted }}>{description || "No event description was saved for this activity."}</p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 gap-2 text-[12px]">
            <span className="rounded-lg bg-[#F7F5F8] px-3 py-2 font-semibold" style={{ color: DASH.heading }}>{formatDate(detail.createdAt, true)}</span>
            <span className="rounded-lg bg-[#F7F5F8] px-3 py-2 font-semibold capitalize" style={{ color: DASH.heading }}>{event?.postingStatus || detail.sourceType}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-4" style={{ borderColor: DASH.border }}>
            <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Event Description</h2>
            <div className="mt-3 rounded-lg bg-[#FAF8FB] p-4 text-[13px] leading-7" style={{ color: DASH.heading }}>
              {description || "No description available."}
            </div>
          </section>

          {(mediaUrl || reelUrl) && (
            <section className="rounded-xl border bg-white p-4" style={{ borderColor: DASH.border }}>
              <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Media</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {mediaUrl && <a href={mediaUrl} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border" style={{ borderColor: DASH.border }}><img src={mediaUrl} alt="" className="aspect-video w-full object-cover transition group-hover:scale-[1.01]" /></a>}
                {reelUrl && <a href={reelUrl} target="_blank" rel="noreferrer" className="flex min-h-36 items-center justify-center gap-2 rounded-lg border bg-[#17121A] text-sm font-bold text-white" style={{ borderColor: DASH.border }}><Video className="h-5 w-5" /> Open reel</a>}
              </div>
            </section>
          )}

          <JsonBlock title="Raw Activity Record" value={detail.activity} />
          <JsonBlock title="Raw Event Record" value={detail.event} />
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border bg-white p-4" style={{ borderColor: DASH.border }}>
            <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Event Facts</h2>
            <div className="mt-2">
              <Field label="Content type" value={<span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{event?.type || detail.activityType}</span>} />
              <Field label="Approved" value={<span className="inline-flex items-center gap-1.5">{approved ? <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" /> : <XCircle className="h-3.5 w-3.5 text-[#DC2626]" />}{approved ? "Yes" : "No"}</span>} />
              <Field label="Scheduled" value={<span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{formatDate(event?.scheduledAt, true)}</span>} />
              <Field label="Posted" value={formatDate(event?.postedAt, true)} />
              <Field label="Calendar" value={detail.calendar?.theme || "Not available"} />
              <Field label="Created" value={formatDate(event?.createdAt || detail.createdAt, true)} />
              <Field label="Updated" value={formatDate(event?.updatedAt || detail.updatedAt, true)} />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4" style={{ borderColor: DASH.border }}>
            <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Links</h2>
            <div className="mt-3 space-y-2">
              {event?.postLink ? <a href={event.postLink} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[12px] font-bold" style={{ borderColor: DASH.border, color: DASH.heading }}><span className="inline-flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" />Published post</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
              {event?.artwork ? <a href={event.artwork} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[12px] font-bold" style={{ borderColor: DASH.border, color: DASH.heading }}><span className="inline-flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" />Artwork</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
              {event?.reelUrl ? <a href={event.reelUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[12px] font-bold" style={{ borderColor: DASH.border, color: DASH.heading }}><span className="inline-flex items-center gap-2"><Video className="h-3.5 w-3.5" />Reel asset</span><ExternalLink className="h-3.5 w-3.5" /></a> : null}
              {!event?.postLink && !event?.artwork && !event?.reelUrl ? <p className="rounded-lg bg-[#FAF8FB] px-3 py-8 text-center text-[12px]" style={{ color: DASH.muted }}><Link2 className="mx-auto mb-2 h-4 w-4" />No event links saved.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
