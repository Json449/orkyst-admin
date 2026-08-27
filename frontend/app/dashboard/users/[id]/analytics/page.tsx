"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarPlus2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  Filter,
  Grid2X2,
  ImageIcon,
  ImageOff,
  Link2,
  List,
  Maximize2,
  PencilLine,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { DASH } from "@/components/dashboard/theme";
import {
  fetchAdminUserAnalytics,
  type AdminUserAnalyticsActivity,
  type AdminUserAnalyticsAsset,
  type AdminUserAnalyticsData,
} from "@/lib/api";

type Filters = {
  dateFrom: string;
  dateTo: string;
  contentType: string;
  activityType: string;
  platform: string;
  campaignId: string;
};

type MetricDefinition = {
  key: "posts" | "images" | "reels" | "calendars" | "ai" | "social";
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  featured?: boolean;
  values: number[];
};

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  contentType: "all",
  activityType: "all",
  platform: "all",
  campaignId: "all",
};

const PANEL_CLASS =
  "overflow-hidden rounded-xl border bg-white shadow-[0_5px_18px_rgba(39,23,52,0.025)]";

const PLATFORM_STYLES: Record<string, { color: string; soft: string; mark: string }> = {
  instagram: { color: "#F0449C", soft: "#FDEAF4", mark: "◎" },
  facebook: { color: "#3974F6", soft: "#EAF1FF", mark: "f" },
  tiktok: { color: "#111827", soft: "#F1F2F4", mark: "♪" },
  linkedin: { color: "#1779B8", soft: "#E7F3FA", mark: "in" },
  twitter: { color: "#111827", soft: "#F1F2F4", mark: "𝕏" },
  x: { color: "#111827", soft: "#F1F2F4", mark: "𝕏" },
};

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

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatFilterDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mediaSourceUrl(value?: string | null) {
  if (!value) return null;
  let url = value.trim();
  if (!url) return null;
  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("http://")) url = `https://${url.slice(7)}`;
  return url;
}

function mediaPreviewUrl(value?: string | null) {
  let url = mediaSourceUrl(value);
  if (!url) return null;
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    url = url.replace("/image/upload/", "/image/upload/f_auto,q_auto:eco,w_720,c_limit/");
  }
  return url;
}

function videoPosterUrl(asset: AdminUserAnalyticsAsset) {
  if (asset.thumbnailUrl) return mediaPreviewUrl(asset.thumbnailUrl);
  const videoUrl = mediaSourceUrl(asset.url);
  if (videoUrl?.includes("res.cloudinary.com") && videoUrl.includes("/video/upload/")) {
    return videoUrl.replace("/video/upload/", "/video/upload/so_0,f_jpg,q_auto,w_720,c_limit/");
  }
  return null;
}

function trendFor(values: number[]) {
  if (!values.length) return 0;
  const middle = Math.max(1, Math.floor(values.length / 2));
  const previous = values.slice(0, middle).reduce((sum, value) => sum + value, 0);
  const current = values.slice(middle).reduce((sum, value) => sum + value, 0);
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function Sparkline({ values, color, inverted = false }: { values: number[]; color: string; inverted?: boolean }) {
  const safeValues = values.length > 1 ? values : [0, values[0] || 0, 0, values[0] || 0, 0];
  const max = Math.max(...safeValues, 1);
  const points = safeValues
    .map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * 148;
      const y = 30 - (value / max) * 23;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg aria-hidden viewBox="0 0 148 34" className="h-8 w-full" preserveAspectRatio="none">
      <line x1="0" y1="31" x2="148" y2="31" stroke={inverted ? "rgba(255,255,255,.18)" : "#F0EDF2"} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ metric }: { metric: MetricDefinition }) {
  const trend = trendFor(metric.values);
  const Icon = metric.icon;
  const featuredStyle = metric.featured
    ? { background: "linear-gradient(135deg,#751158 0%,#A20D68 100%)", borderColor: "#8F105B" }
    : { background: "#FFFFFF", borderColor: DASH.border };

  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border px-4 pb-2.5 pt-3.5" style={featuredStyle}>
      {metric.featured && <span className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />}
      <div className="relative flex items-start justify-between gap-3">
        <p className="truncate text-[11px] font-bold" style={{ color: metric.featured ? "#FFFFFF" : DASH.heading }}>{metric.label}</p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: metric.featured ? "rgba(255,255,255,.15)" : "#FCE9F3", color: metric.featured ? "#FFFFFF" : "#A30D70" }}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <strong className="relative mt-1 block text-[24px] leading-none tracking-[-0.04em]" style={{ color: metric.featured ? "#FFFFFF" : DASH.heading }}>{metric.value.toLocaleString()}</strong>
      <div className="relative mt-2 flex items-center gap-1 text-[11px]" style={{ color: metric.featured ? "rgba(255,255,255,.8)" : trend >= 0 ? "#059669" : "#DC2626" }}>
        <TrendingUp className={`h-3 w-3 ${trend < 0 ? "rotate-180" : ""}`} />
        <span className="font-bold">{trend >= 0 ? "+" : ""}{trend}%</span>
        <span style={{ color: metric.featured ? "rgba(255,255,255,.55)" : DASH.subtle }}>vs previous period</span>
      </div>
      <div className="relative mt-1">
        <Sparkline values={metric.values} color={metric.featured ? "#FFFFFF" : metric.color} inverted={metric.featured} />
      </div>
    </article>
  );
}

function PlatformMark({ platform, size = "sm" }: { platform?: string | null; size?: "sm" | "md" }) {
  const normalized = (platform || "").toLowerCase();
  const style = PLATFORM_STYLES[normalized] || { color: "#7A0860", soft: "#FCE9F3", mark: "•" };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${size === "md" ? "h-8 w-8 text-[12px]" : "h-5 w-5 text-[11px]"}`}
      style={{ backgroundColor: style.soft, color: style.color }}
      aria-label={platform ? titleCase(platform) : "Activity"}
    >
      {style.mark}
    </span>
  );
}

function ActivityIcon({ activityType, platform }: { activityType: string; platform?: string | null }) {
  const type = activityType.toLowerCase();
  let Icon: LucideIcon = FileText;
  let color = "#A30D70";
  let background = "#F8EAF4";

  if (type.includes("failed")) {
    Icon = CircleAlert;
    color = "#DC2626";
    background = "#FEF2F2";
  } else if (type.includes("delete") || type.includes("removed")) {
    Icon = Trash2;
    color = "#DC2626";
    background = "#FEF2F2";
  } else if (type.includes("approved")) {
    Icon = CircleCheckBig;
    color = "#059669";
    background = "#ECFDF5";
  } else if (type.includes("publish")) {
    Icon = Send;
    color = "#2563EB";
    background = "#EFF6FF";
  } else if (type.includes("schedule")) {
    Icon = CalendarClock;
  } else if (type.includes("calendar_created")) {
    Icon = CalendarPlus2;
  } else if (type.includes("image") || type.includes("artwork")) {
    Icon = ImageIcon;
    color = "#DB2777";
    background = "#FDF2F8";
  } else if (type.includes("reel")) {
    Icon = Video;
    color = "#7C3AED";
    background = "#F5F3FF";
  } else if (type.includes("edit") || type.includes("updated") || type.includes("synced")) {
    Icon = PencilLine;
  } else if (type.includes("social") || type.includes("connected")) {
    Icon = Link2;
    color = "#2563EB";
    background = "#EFF6FF";
  } else if (type.includes("created")) {
    Icon = FilePlus2;
  }

  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: background, color }}>
      <Icon className="h-3.5 w-3.5" />
      {platform && <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-px"><PlatformMark platform={platform} /></span>}
    </span>
  );
}

function Pagination({ page, pages, total, hasPrevious, hasNext, onPage, compact = false }: { page: number; pages: number; total: number; hasPrevious: boolean; hasNext: boolean; onPage: (page: number) => void; compact?: boolean }) {
  if (pages <= 1 && compact) return null;
  return (
    <div className={`flex items-center justify-between gap-3 border-t ${compact ? "px-4 py-2.5" : "px-5 py-3"}`} style={{ borderColor: DASH.border }}>
      <span className="text-[10px]" style={{ color: DASH.muted }}>{total.toLocaleString()} total</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous page" disabled={!hasPrevious} onClick={() => onPage(page - 1)} className="rounded-md border p-1.5 disabled:opacity-35" style={{ borderColor: DASH.border }}><ChevronLeft className="h-3.5 w-3.5" /></button>
        <span className="text-[10px]" style={{ color: DASH.muted }}>{page} / {pages}</span>
        <button type="button" aria-label="Next page" disabled={!hasNext} onClick={() => onPage(page + 1)} className="rounded-md border p-1.5 disabled:opacity-35" style={{ borderColor: DASH.border }}><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function AssetPreview({ asset, controls = true }: { asset: AdminUserAnalyticsAsset; controls?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (asset.mediaKind === "video" && asset.url) {
    const videoUrl = mediaSourceUrl(asset.url);
    const posterUrl = videoPosterUrl(asset);
    if (!controls && posterUrl && !imageFailed) {
      return <img src={posterUrl} alt={`${asset.title} reel preview`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />;
    }
    return <video src={videoUrl ? `${videoUrl}#t=0.1` : undefined} poster={posterUrl || undefined} controls={controls} muted={!controls} playsInline preload={controls ? "metadata" : "auto"} className="h-full w-full object-cover" />;
  }
  const imageUrl = mediaPreviewUrl(asset.thumbnailUrl || asset.url);
  if (asset.mediaKind === "image" && imageUrl && !imageFailed) {
    return <img src={imageUrl} alt={asset.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#FCE9F1] to-[#F2EEF7] px-4 text-center">
      {imageFailed ? <ImageOff className="h-7 w-7" style={{ color: DASH.plum }} /> : asset.contentType === "reel" ? <Video className="h-7 w-7" style={{ color: DASH.plum }} /> : <FileText className="h-7 w-7" style={{ color: DASH.plum }} />}
      <span className="mt-2 line-clamp-2 text-[10px] font-semibold" style={{ color: DASH.heading }}>{asset.title}</span>
    </div>
  );
}

const MEDIA_TABS = [
  { value: "all", label: "All" },
  { value: "artwork", label: "Artwork" },
  { value: "reel", label: "Reels" },
  { value: "post", label: "Posts" },
  { value: "asset", label: "Other Assets" },
] as const;

function ContentGallery({ data, activeType, onType, onPage }: { data: AdminUserAnalyticsData; activeType: string; onType: (type: string) => void; onPage: (page: number) => void }) {
  const [selectedAsset, setSelectedAsset] = useState<AdminUserAnalyticsAsset | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const sortedAssets = useMemo(() => [...data.gallery].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return sort === "latest" ? bTime - aTime : aTime - bTime;
  }), [data.gallery, sort]);

  function openAsset(asset: AdminUserAnalyticsAsset) {
    const canPreview = (asset.mediaKind === "image" || asset.mediaKind === "video") && asset.url;
    if (canPreview) {
      setSelectedAsset(asset);
      return;
    }
    const externalUrl = asset.postUrl || (asset.mediaKind === "link" ? asset.url : null);
    if (externalUrl) window.open(externalUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className={`${PANEL_CLASS} min-w-0`} data-testid="generated-media-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-2 pt-4">
        <div><h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Generated Media</h2><p className="mt-0.5 text-[10px]" style={{ color: DASH.muted }}>Real artwork, reels, and uploaded assets created by this user</p></div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-white p-0.5" style={{ borderColor: DASH.border }}>
            <button type="button" aria-label="Grid view" onClick={() => setView("grid")} className="rounded-md p-1.5" style={{ backgroundColor: view === "grid" ? "#FCE9F3" : "transparent", color: view === "grid" ? DASH.plum : DASH.subtle }}><Grid2X2 className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="List view" onClick={() => setView("list")} className="rounded-md p-1.5" style={{ backgroundColor: view === "list" ? "#FCE9F3" : "transparent", color: view === "list" ? DASH.plum : DASH.subtle }}><List className="h-3.5 w-3.5" /></button>
          </div>
          <select aria-label="Sort media" value={sort} onChange={(event) => setSort(event.target.value as "latest" | "oldest")} className="h-8 rounded-lg border bg-white px-2 text-[10px] outline-none" style={{ borderColor: DASH.border, color: DASH.heading }}>
            <option value="latest">Sort by: Latest</option>
            <option value="oldest">Sort by: Oldest</option>
          </select>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-4 pb-3" role="tablist" aria-label="Generated media types">
        {MEDIA_TABS.map(({ value, label }) => {
          const selected = activeType === value;
          return (
            <button key={value} type="button" role="tab" aria-selected={selected} onClick={() => onType(value)} className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-semibold" style={{ borderColor: selected ? DASH.plum : DASH.border, backgroundColor: selected ? DASH.plum : "#FFFFFF", color: selected ? "#FFFFFF" : DASH.heading }}>
              {label}<span className="rounded-full px-1.5 py-0.5 text-[11px]" style={{ backgroundColor: selected ? "rgba(255,255,255,.18)" : "#F3F1F5", color: selected ? "#FFFFFF" : DASH.muted }}>{(data.galleryCounts[value] || 0).toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {sortedAssets.length ? (
        view === "grid" ? (
          <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {sortedAssets.map((asset) => {
              const canPreview = (asset.mediaKind === "image" || asset.mediaKind === "video") && Boolean(asset.url);
              const externalUrl = asset.postUrl || (asset.mediaKind === "link" ? asset.url : null);
              const canOpen = canPreview || Boolean(externalUrl);
              return (
                <article key={asset.id} className="group min-w-0">
                  <button type="button" disabled={!canOpen} onClick={() => openAsset(asset)} aria-label={canPreview ? `Preview ${asset.title}` : externalUrl ? `Open ${asset.title}` : undefined} className="relative block aspect-[1.45/1] w-full overflow-hidden rounded-lg border bg-[#F4F1F5] text-left disabled:cursor-default" style={{ borderColor: DASH.border }}>
                    <AssetPreview asset={asset} controls={false} />
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-white/95 px-1.5 py-0.5 text-[7px] font-bold uppercase shadow-sm" style={{ color: DASH.plum }}>{asset.contentType === "asset" ? "asset" : asset.contentType}</span>
                    {canOpen && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/45 text-white opacity-90 shadow-sm transition-opacity group-hover:opacity-100">{canPreview ? asset.mediaKind === "video" ? <Play className="h-3 w-3 fill-current" /> : <Maximize2 className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}</span>}
                    {asset.mediaKind === "video" && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-black/30 text-white shadow-sm backdrop-blur-sm"><Play className="ml-0.5 h-4 w-4 fill-current" /></span></span>}
                  </button>
                  <p className="mt-1.5 truncate text-[11px] font-semibold" style={{ color: DASH.heading }}>{asset.title}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px]" style={{ color: DASH.muted }}><span className="truncate">{formatDate(asset.createdAt)}</span><PlatformMark platform={asset.platform} /></div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="divide-y px-4 pb-2" style={{ borderColor: DASH.border }}>
            {sortedAssets.map((asset) => {
              const canPreview = (asset.mediaKind === "image" || asset.mediaKind === "video") && Boolean(asset.url);
              const externalUrl = asset.postUrl || (asset.mediaKind === "link" ? asset.url : null);
              const canOpen = canPreview || Boolean(externalUrl);
              return (
                <article key={asset.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                  <div className="h-11 overflow-hidden rounded-md bg-[#F4F1F5]"><AssetPreview asset={asset} controls={false} /></div>
                  <div className="min-w-0"><p className="truncate text-[10px] font-bold" style={{ color: DASH.heading }}>{asset.title}</p><p className="mt-0.5 truncate text-[11px]" style={{ color: DASH.muted }}>{asset.campaignName || "Unassigned"} · {formatDate(asset.createdAt)}</p></div>
                  {canOpen && <button type="button" aria-label={canPreview ? `Preview ${asset.title}` : `Open ${asset.title}`} onClick={() => openAsset(asset)} className="rounded-md border p-1.5" style={{ borderColor: DASH.border, color: DASH.plum }}>{canPreview ? <Maximize2 className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}</button>}
                </article>
              );
            })}
          </div>
        )
      ) : <p className="px-5 py-12 text-center text-[11px]" style={{ color: DASH.muted }}>No content matches these filters.</p>}

      <Pagination {...data.galleryPagination} onPage={onPage} compact />

      {selectedAsset && (
        <div role="dialog" aria-modal="true" aria-label={`${selectedAsset.title} preview`} className="fixed inset-0 z-50 flex items-center justify-center bg-[#17040F]/80 p-4 backdrop-blur-sm" onClick={() => setSelectedAsset(null)}>
          <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: DASH.border }}>
              <div className="min-w-0"><h3 className="truncate text-base font-bold" style={{ color: DASH.heading }}>{selectedAsset.title}</h3><p className="mt-0.5 text-xs capitalize" style={{ color: DASH.muted }}>{selectedAsset.contentType} · {formatDate(selectedAsset.createdAt, true)}</p></div>
              <div className="flex items-center gap-2">
                {(selectedAsset.postUrl || selectedAsset.url) && <a href={selectedAsset.postUrl || selectedAsset.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open ${selectedAsset.title} asset`} className="rounded-xl border p-2" style={{ borderColor: DASH.border, color: DASH.accent }}><ExternalLink className="h-4 w-4" /></a>}
                <button type="button" onClick={() => setSelectedAsset(null)} aria-label="Close media preview" className="rounded-xl border p-2" style={{ borderColor: DASH.border, color: DASH.heading }}><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[#F4F1F5] p-4 sm:p-6">
              {selectedAsset.mediaKind === "video" ? <video src={mediaSourceUrl(selectedAsset.url) || undefined} poster={videoPosterUrl(selectedAsset) || undefined} controls autoPlay playsInline className="max-h-[76vh] max-w-full rounded-xl object-contain" /> : <img src={mediaSourceUrl(selectedAsset.url || selectedAsset.thumbnailUrl) || ""} alt={selectedAsset.title} referrerPolicy="no-referrer" className="max-h-[76vh] max-w-full rounded-xl object-contain shadow-sm" />}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ActivityOverview({ metrics }: { metrics: MetricDefinition[] }) {
  const items = metrics.map((metric) => ({ label: metric.label.replace("Images / Artwork", "Artwork / Images").replace("AI Generations / Edits", "AI Generations / Edits"), value: metric.value, color: metric.color }));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = total
    ? `conic-gradient(${items.map((item) => { const start = cursor; cursor += (item.value / total) * 360; return `${item.color} ${start}deg ${cursor}deg`; }).join(",")})`
    : "conic-gradient(#EEEAF4 0deg 360deg)";

  return (
    <section className={`${PANEL_CLASS} h-full px-4 py-4`}>
      <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Activity Overview</h2><p className="mt-0.5 text-[10px]" style={{ color: DASH.muted }}>Breakdown of user activities</p>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-full" style={{ background: gradient }}><span className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-white"><strong className="text-[22px] leading-none" style={{ color: DASH.heading }}>{total.toLocaleString()}</strong><span className="mt-1 text-[11px]" style={{ color: DASH.muted }}>Total Activities</span></span></div>
        <div className="min-w-0 flex-1 space-y-2">{items.map((item) => <div key={item.label} className="flex items-center gap-2 text-[11px]"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 flex-1 truncate" style={{ color: DASH.muted }}>{item.label}</span><strong style={{ color: DASH.heading }}>{item.value}</strong><span className="w-8 text-right" style={{ color: DASH.subtle }}>{total ? Math.round((item.value / total) * 100) : 0}%</span></div>)}</div>
      </div>
    </section>
  );
}

function PlatformDistribution({ activities, gallery }: { activities: AdminUserAnalyticsActivity[]; gallery: AdminUserAnalyticsAsset[] }) {
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    activities.forEach((item) => item.platform && counts.set(item.platform.toLowerCase(), (counts.get(item.platform.toLowerCase()) || 0) + 1));
    gallery.forEach((item) => item.platform && counts.set(item.platform.toLowerCase(), (counts.get(item.platform.toLowerCase()) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [activities, gallery]);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  const max = Math.max(...rows.map(([, value]) => value), 1);

  return (
    <section className={`${PANEL_CLASS} h-full px-4 py-4`}>
      <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Platform Distribution</h2><p className="mt-0.5 text-[10px]" style={{ color: DASH.muted }}>Activities by social platform</p>
      {rows.length ? <div className="mt-5 space-y-4">{rows.map(([platform, value]) => { const style = PLATFORM_STYLES[platform] || { color: DASH.plum }; return <div key={platform}><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="capitalize" style={{ color: DASH.heading }}>{platform}</span><span style={{ color: DASH.muted }}>{value} ({total ? Math.round((value / total) * 100) : 0}%)</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#F1EFF3]"><div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: style.color }} /></div></div>; })}</div> : <p className="py-12 text-center text-[11px]" style={{ color: DASH.muted }}>No platform activity.</p>}
    </section>
  );
}

function TopCampaigns({ activities, gallery }: { activities: AdminUserAnalyticsActivity[]; gallery: AdminUserAnalyticsAsset[] }) {
  const campaigns = useMemo(() => {
    const map = new Map<string, { count: number; image?: string | null }>();
    activities.forEach((item) => { if (item.campaignName) { const entry = map.get(item.campaignName) || { count: 0 }; entry.count += 1; map.set(item.campaignName, entry); } });
    gallery.forEach((item) => { if (item.campaignName) { const entry = map.get(item.campaignName) || { count: 0 }; entry.count += 1; entry.image ||= item.thumbnailUrl || item.url; map.set(item.campaignName, entry); } });
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 4);
  }, [activities, gallery]);
  const total = campaigns.reduce((sum, [, item]) => sum + item.count, 0);

  return (
    <section className={`${PANEL_CLASS} h-full px-4 py-4`}>
      <h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Top Campaigns</h2><p className="mt-0.5 text-[10px]" style={{ color: DASH.muted }}>By activity count</p>
      {campaigns.length ? <div className="mt-3 space-y-2.5">{campaigns.map(([name, item]) => <div key={name} className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F6EAF2]">{item.image ? <img src={mediaPreviewUrl(item.image) || ""} alt="" loading="lazy" className="h-full w-full object-cover" /> : <BarChart3 className="h-3.5 w-3.5" style={{ color: DASH.plum }} />}</div><p className="min-w-0 flex-1 truncate text-[11px] font-bold" style={{ color: DASH.heading }}>{name}</p><span className="shrink-0 text-[11px]" style={{ color: DASH.muted }}>{item.count} ({total ? Math.round((item.count / total) * 100) : 0}%)</span></div>)}</div> : <p className="py-12 text-center text-[11px]" style={{ color: DASH.muted }}>No campaign activity.</p>}
    </section>
  );
}

function ActivityTimeline({ data, onPage }: { data: AdminUserAnalyticsData; onPage: (page: number) => void }) {
  return (
    <section className={`${PANEL_CLASS} min-w-0`} data-testid="activity-timeline-panel">
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4"><div><h2 className="text-[13px] font-bold" style={{ color: DASH.heading }}>Activity Timeline</h2><p className="mt-0.5 text-[10px]" style={{ color: DASH.muted }}>Every recorded action for this user</p></div><span className="shrink-0 rounded-full bg-[#F8EAF4] px-2.5 py-1 text-[11px] font-bold" style={{ color: DASH.plum }}>{data.activityPagination.total.toLocaleString()} activities</span></div>
      {data.activity.length ? <ol className="relative space-y-3 px-4 py-3"><span className="absolute bottom-5 left-[91px] top-5 w-px" style={{ backgroundColor: DASH.border }} aria-hidden />{data.activity.map((item) => <ActivityRow key={item.id} item={item} />)}</ol> : <p className="px-5 py-12 text-center text-[11px]" style={{ color: DASH.muted }}>No activity matches these filters.</p>}
      <Pagination {...data.activityPagination} onPage={onPage} compact />
    </section>
  );
}

function ActivityRow({ item }: { item: AdminUserAnalyticsActivity }) {
  const isPublish = item.activityType.includes("published");
  const isFailed = item.activityType.includes("failed");
  return (
    <li className="relative grid grid-cols-[56px_14px_minmax(0,1fr)] items-start gap-2">
      <time className="pt-1 text-right text-[11px]" style={{ color: DASH.muted }}>{formatTime(item.createdAt)}</time>
      <span className="relative z-10 mt-1.5 h-2 w-2 rounded-full ring-[3px] ring-white" style={{ backgroundColor: isFailed ? "#DC2626" : isPublish ? "#3974F6" : DASH.plum }} />
      <div className="min-w-0"><div className="flex items-center gap-2"><ActivityIcon activityType={item.activityType} platform={item.platform} /><div className="min-w-0"><p className="truncate text-[11px] font-bold" style={{ color: DASH.heading }}>{item.title}</p><p className="mt-0.5 truncate text-[11px]" style={{ color: DASH.muted }}>{item.description || titleCase(item.activityType)}</p></div></div></div>
    </li>
  );
}

export default function UserAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserAnalyticsData | null>(null);
  const [filterOptions, setFilterOptions] = useState<AdminUserAnalyticsData["filterOptions"] | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [galleryPage, setGalleryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchAdminUserAnalytics(params.id, { ...filters, galleryPage, galleryPageSize: 6, activityPage, activityPageSize: 100 })
      .then((result) => {
        if (!active) return;
        setData(result);
        setFilterOptions((current) => current || result.filterOptions);
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Unable to load user analytics"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [params.id, filters, galleryPage, activityPage, reloadKey]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setGalleryPage(1);
    setActivityPage(1);
  }

  if (loading && !data) return <div className="space-y-3"><div className="h-5 w-56 max-w-full animate-pulse rounded bg-[#EDEAF0]" /><div className="h-24 animate-pulse rounded-xl bg-white" /><div className="h-24 animate-pulse rounded-xl bg-white" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-6">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-white" />)}</div><div className="h-72 animate-pulse rounded-xl bg-white" /></div>;
  if (error || !data) return <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: DASH.border }}><p className="text-lg font-bold" style={{ color: DASH.heading }}>User analytics could not be loaded</p><p className="mt-2 text-sm" style={{ color: DASH.muted }}>{error || "User not found"}</p><div className="mt-6 flex justify-center gap-3"><Link href={`/dashboard/users/${params.id}`} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: DASH.border, color: DASH.heading }}>Back to profile</Link><button onClick={() => setReloadKey((value) => value + 1)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: DASH.plum }}><RefreshCw className="h-4 w-4" />Try again</button></div></div>;

  const options = filterOptions || data.filterOptions;
  const timeline = data.contentTimeline;
  const metricValues = {
    posts: timeline.map((item) => item.posts),
    images: timeline.map((item) => item.images),
    reels: timeline.map((item) => item.reels),
    calendars: timeline.map((item) => item.calendars),
  };
  const metrics: MetricDefinition[] = [
    { key: "posts", label: "Posts Created", value: data.metrics.posts, icon: FileText, featured: true, color: "#A30D70", values: metricValues.posts },
    { key: "images", label: "Images / Artwork", value: data.metrics.images, icon: ImageIcon, color: "#8B45DC", values: metricValues.images },
    { key: "reels", label: "Reels Generated", value: data.metrics.reels, icon: Video, color: "#F0449C", values: metricValues.reels },
    { key: "calendars", label: "Calendars Created", value: data.metrics.calendars, icon: CalendarDays, color: "#F97316", values: metricValues.calendars },
    { key: "ai", label: "AI Generations / Edits", value: data.metrics.aiGenerationsEdits, icon: Sparkles, color: "#3974F6", values: timeline.map((item) => item.images + item.reels) },
    { key: "social", label: "Social Activity", value: data.metrics.socialActivity, icon: Share2, color: "#9139CC", values: timeline.map((item) => item.posts + item.reels) },
  ];
  const dateRangeLabel = filters.dateFrom || filters.dateTo
    ? `${formatFilterDate(filters.dateFrom) || "Start"} – ${formatFilterDate(filters.dateTo) || "Today"}`
    : "All time";
  const reportUserId = data.user.id;

  function exportReport() {
    const rows = [
      ["Metric", "Value"],
      ...metrics.map((metric) => [metric.label, String(metric.value)]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-analytics-${reportUserId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`mx-auto max-w-[1680px] pb-6 ${loading ? "opacity-65 transition-opacity" : "transition-opacity"}`} data-testid="user-analytics-screen">
      <nav className="flex flex-wrap items-center gap-2 text-[10px]" style={{ color: DASH.muted }}><Link href="/dashboard/users" className="hover:underline">Users</Link><ChevronRight className="h-3 w-3" /><Link href={`/dashboard/users/${params.id}`} className="max-w-64 truncate hover:underline">{data.user.fullname || data.user.email}</Link><ChevronRight className="h-3 w-3" /><span className="font-semibold" style={{ color: DASH.heading }}>Analytics</span></nav>

      <section className={`${PANEL_CLASS} mt-3 px-3 py-3.5 sm:px-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#FCE5F1,#F8EAF8)] text-[#A30D70]"><Users className="h-6 w-6" /></span>
            <div className="min-w-0"><h1 className="text-[20px] font-bold tracking-[-0.035em]" style={{ color: DASH.heading }}>User Analytics</h1><p className="mt-0.5 truncate text-[10px] font-semibold" style={{ color: DASH.heading }}>{data.user.fullname || "Unnamed user"}<span className="mx-2 font-normal" style={{ color: DASH.subtle }}>•</span><span className="font-normal" style={{ color: DASH.muted }}>{data.user.email}</span></p><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: DASH.subtle }}><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Last active {formatDate(data.user.lastActiveAt, true)}</span></p></div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <Link href={`/dashboard/users/${params.id}`} className="flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-[10px] font-semibold" style={{ borderColor: DASH.border, color: DASH.heading }}><ArrowLeft className="h-3.5 w-3.5" />Back to profile</Link>
            <span className="hidden h-8 items-center gap-2 rounded-lg border bg-white px-3 text-[10px] sm:flex" style={{ borderColor: DASH.border, color: DASH.heading }}><CalendarDays className="h-3.5 w-3.5" />{dateRangeLabel}</span>
            <button type="button" onClick={exportReport} className="flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-semibold text-white shadow-sm" style={{ background: "linear-gradient(135deg,#731050,#A40A74)" }}><Download className="h-3.5 w-3.5" />Export</button>
          </div>
        </div>
      </section>

      <section className={`${PANEL_CLASS} mt-2.5 px-3 py-3 sm:px-4`}>
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" style={{ color: DASH.plum }} /><h2 className="text-[11px] font-bold" style={{ color: DASH.heading }}>Filters</h2></div><button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setGalleryPage(1); setActivityPage(1); }} className="flex items-center gap-1 text-[11px] font-semibold hover:underline" style={{ color: DASH.accent }}><RotateCcw className="h-3 w-3" />Reset filters</button></div>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div><span className="text-[11px] font-semibold" style={{ color: DASH.muted }}>Date range</span><div className="mt-1 grid grid-cols-2 gap-1.5"><input aria-label="From date" type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(event) => updateFilter("dateFrom", event.target.value)} className="h-8 min-w-0 rounded-lg border bg-white px-2 text-[11px] outline-none" style={{ borderColor: DASH.border, color: DASH.heading }} /><input aria-label="To date" type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(event) => updateFilter("dateTo", event.target.value)} className="h-8 min-w-0 rounded-lg border bg-white px-2 text-[11px] outline-none" style={{ borderColor: DASH.border, color: DASH.heading }} /></div></div>
          <FilterSelect label="Content type" value={filters.contentType} onChange={(value) => updateFilter("contentType", value)} options={options.contentTypes.map((value) => ({ value, label: titleCase(value) }))} />
          <FilterSelect label="Activity type" value={filters.activityType} onChange={(value) => updateFilter("activityType", value)} options={options.activityTypes.map((value) => ({ value, label: titleCase(value) }))} />
          <FilterSelect label="Social platform" value={filters.platform} onChange={(value) => updateFilter("platform", value)} options={options.platforms.map((value) => ({ value, label: titleCase(value) }))} />
          <FilterSelect label="Campaign" value={filters.campaignId} onChange={(value) => updateFilter("campaignId", value)} options={options.campaigns.map((item) => ({ value: item.id, label: item.name }))} />
        </div>
      </section>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">{metrics.map((metric) => <MetricCard key={metric.key} metric={metric} />)}</div>

      <div className="mt-2.5 grid items-stretch gap-2.5 lg:grid-cols-3">
        <ActivityOverview metrics={metrics} />
        <PlatformDistribution activities={data.activity} gallery={data.gallery} />
        <TopCampaigns activities={data.activity} gallery={data.gallery} />
      </div>

      <div className="mt-2.5 space-y-2.5">
        <ContentGallery data={data} activeType={filters.contentType} onType={(value) => updateFilter("contentType", value)} onPage={setGalleryPage} />
        <ActivityTimeline data={data} onPage={setActivityPage} />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  const allLabel: Record<string, string> = {
    "Content type": "All content",
    "Activity type": "All activities",
    "Social platform": "All platforms",
    Campaign: "All campaigns",
  };
  return <label className="text-[11px] font-semibold" style={{ color: DASH.muted }}>{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-8 w-full rounded-lg border bg-white px-2 text-[11px] font-normal outline-none" style={{ borderColor: DASH.border, color: DASH.heading }}><option value="all">{allLabel[label] || "All"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
