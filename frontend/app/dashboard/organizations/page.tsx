"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Plus, Search } from "lucide-react";
import { OrganizationsTable } from "@/components/dashboard/organizations-table";
import { DASH } from "@/components/dashboard/theme";
import {
  fetchAdminOrganizations,
  type AdminOrganizationsData,
} from "@/lib/api";

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "onboarding", label: "Onboarding" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
] as const;

export default function OrganizationsPage() {
  const [data, setData] = useState<AdminOrganizationsData | null>(null);
  const [status, setStatus] = useState<(typeof TABS)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [plan, setPlan] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => setPage(1), [debouncedQuery, status, plan]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchAdminOrganizations({ query: debouncedQuery, status, plan, page, pageSize: 10 })
      .then((result) => active && setData(result))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load organizations");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [debouncedQuery, status, plan, page, reloadKey]);

  const showing = useMemo(() => {
    if (!data?.pagination.total) return "0";
    const start = (data.pagination.page - 1) * data.pagination.pageSize + 1;
    return `${start}–${Math.min(start + data.items.length - 1, data.pagination.total)}`;
  }, [data]);

  function exportRows() {
    if (!data?.items.length) return;
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Organization", "Owner Email", "Industry", "Country", "Plan", "Users", "Status", "Joined"],
      ...data.items.map((org) => [org.name, org.ownerEmail ?? "", org.industry, org.country, org.plan, org.users, org.status, org.joined]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orkyst-organizations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-[36px]" style={{ color: DASH.heading }}>Organizations</h1>
          <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>Every customer account on Orkyst.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button onClick={exportRows} disabled={!data?.items.length} className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 sm:px-5" style={{ borderColor: DASH.border, color: DASH.heading }}>
            <Download className="h-4 w-4" /> Export results
          </button>
          <Link href="/dashboard/organizations/new" className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white sm:px-5" style={{ backgroundColor: DASH.plum }}>
            <Plus className="h-4 w-4" /> Create Organization
          </Link>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-[390px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search organizations…" className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm outline-none" style={{ borderColor: DASH.border }} />
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border bg-white p-1" style={{ borderColor: DASH.border }}>
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => setStatus(tab.value)} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm ${status === tab.value ? "font-bold shadow-sm" : ""}`} style={{ color: status === tab.value ? DASH.heading : DASH.muted }}>
              {tab.label}<span className="text-xs font-semibold" style={{ color: status === tab.value ? DASH.plum : DASH.subtle }}>{data?.statusCounts[tab.value] ?? "—"}</span>
            </button>
          ))}
        </div>
        <select value={plan} onChange={(event) => setPlan(event.target.value)} className="h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none sm:ml-auto sm:w-auto" style={{ borderColor: DASH.border, color: DASH.heading }}>
          <option value="all">All plans</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
        </select>
      </div>

      <p className="mt-6 text-sm" style={{ color: DASH.muted }}>Showing <span className="font-bold" style={{ color: DASH.heading }}>{showing}</span> of {data?.pagination.total ?? 0} organizations</p>
      <div className="mt-4">
        {error ? (
          <div className="rounded-2xl border bg-white px-6 py-14 text-center" style={{ borderColor: DASH.border }}>
            <p className="font-semibold" style={{ color: DASH.heading }}>Organizations could not be loaded</p>
            <p className="mt-1 text-sm" style={{ color: DASH.muted }}>{error}</p>
            <button onClick={() => setReloadKey((value) => value + 1)} className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: DASH.plum }}>Try again</button>
          </div>
        ) : loading && !data ? (
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: DASH.border }}>{[0, 1, 2, 3].map((row) => <div key={row} className="mb-3 h-16 animate-pulse rounded-xl bg-[#F3F1F5] last:mb-0" />)}</div>
        ) : data?.items.length ? (
          <div className={loading ? "opacity-60" : ""}><OrganizationsTable rows={data.items} /></div>
        ) : (
          <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: DASH.border }}><p className="font-semibold" style={{ color: DASH.heading }}>No organizations found</p></div>
        )}
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button aria-label="Previous page" disabled={!data.pagination.hasPrevious || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" style={{ borderColor: DASH.border }}><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm" style={{ color: DASH.muted }}>Page <strong style={{ color: DASH.heading }}>{data.pagination.page}</strong> of {data.pagination.pages}</span>
          <button aria-label="Next page" disabled={!data.pagination.hasNext || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" style={{ borderColor: DASH.border }}><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </>
  );
}
