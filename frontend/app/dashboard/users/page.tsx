"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Search, Users } from "lucide-react";
import { UsersTable } from "@/components/dashboard/users/users-table";
import { DASH } from "@/components/dashboard/theme";
import {
  type AdminUserStatus,
  fetchAdminUsers,
  setAdminUserAccountStatus,
} from "@/lib/api";

const TABS: Array<{ value: "all" | AdminUserStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "onboarding", label: "Onboarding" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

export default function UsersPage() {
  const [status, setStatus] = useState<"all" | AdminUserStatus>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [plan, setPlan] = useState("all");
  const [provider, setProvider] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => setPage(1), [debouncedQuery, status, plan, provider, pageSize]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { query: debouncedQuery, status, plan, provider, page, pageSize }],
    queryFn: () => fetchAdminUsers({ query: debouncedQuery, status, plan, provider, page, pageSize }),
    placeholderData: (previousData) => previousData,
  });
  const accountStatusMutation = useMutation({
    mutationFn: ({ userId, active, code }: { userId: string; active: boolean; code: string }) =>
      setAdminUserAccountStatus(userId, active, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
  const data = usersQuery.data;
  const loading = usersQuery.isFetching;
  const error = usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load users";

  const pageNumbers = useMemo(() => {
    if (!data) return [];
    const start = Math.max(1, Math.min(data.pagination.page - 2, data.pagination.pages - 4));
    const end = Math.min(data.pagination.pages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [data]);

  const showing = useMemo(() => {
    if (!data?.pagination.total) return "0";
    const start = (data.pagination.page - 1) * data.pagination.pageSize + 1;
    const end = Math.min(start + data.items.length - 1, data.pagination.total);
    return `${start}–${end}`;
  }, [data]);

  function exportUsers() {
    if (!data?.items.length) return;
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Name", "Email", "Status", "Plan", "Provider", "Joined"],
      ...data.items.map((user) => [user.fullname, user.email, user.status, user.plan, user.provider, user.createdAt || ""]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orkyst-users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-[36px]" style={{ color: DASH.heading }}>Users</h1>
          <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>Every person with access to Orkyst.</p>
        </div>
        <button
          onClick={exportUsers}
          disabled={!data?.items.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FAFAFB] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          style={{ borderColor: DASH.border, color: DASH.heading }}
        >
          <Download className="h-4 w-4" /> Export current results
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
        <div className="relative w-full max-w-[390px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search name, email, or company…"
            className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#8A1253]/15"
            style={{ borderColor: DASH.border }}
          />
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border bg-white p-1" style={{ borderColor: DASH.border }}>
          {TABS.map((tab) => {
            const selected = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`flex whitespace-nowrap items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm transition-colors ${selected ? "font-bold shadow-sm" : "hover:bg-[#FAFAFB]"}`}
                style={{ color: selected ? DASH.heading : DASH.muted }}
              >
                {tab.label}
                <span className="text-xs font-semibold" style={{ color: selected ? DASH.plum : DASH.subtle }}>
                  {data?.statusCounts[tab.value] ?? "—"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
          <select value={plan} onChange={(event) => setPlan(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm outline-none sm:w-auto sm:flex-none sm:px-4" style={{ borderColor: DASH.border, color: DASH.heading }}>
            <option value="all">All plans</option><option value="basic">Basic</option><option value="pro">Pro</option>
          </select>
          <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm outline-none sm:w-auto sm:flex-none sm:px-4" style={{ borderColor: DASH.border, color: DASH.heading }}>
            <option value="all">All sign-ins</option><option value="local">Email</option><option value="google">Google</option><option value="apple">Apple</option><option value="ant">Ant</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm" style={{ color: DASH.muted }}>
        <p>Showing <span className="font-bold" style={{ color: DASH.heading }}>{showing}</span> of {data?.pagination.total ?? 0} users</p>
      </div>

      <div className="mt-4">
        {usersQuery.isError ? (
          <div className="rounded-2xl border bg-white px-6 py-14 text-center" style={{ borderColor: DASH.border }}>
            <p className="font-semibold" style={{ color: DASH.heading }}>Users could not be loaded</p>
            <p className="mt-1 text-sm" style={{ color: DASH.muted }}>{error}</p>
            <button onClick={() => usersQuery.refetch()} className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: DASH.plum }}>Try again</button>
          </div>
        ) : loading && !data ? (
          <div className="overflow-hidden rounded-2xl border bg-white p-5" style={{ borderColor: DASH.border }}>
            {[0, 1, 2, 3, 4].map((row) => <div key={row} className="mb-3 h-14 animate-pulse rounded-xl bg-[#F3F1F5] last:mb-0" />)}
          </div>
        ) : data?.items.length ? (
          <div className={loading ? "opacity-60" : ""}>
            <UsersTable
              users={data.items}
              onAccountStatusChange={async (user, active, code) => {
                await accountStatusMutation.mutateAsync({ userId: user.id, active, code });
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: DASH.border }}>
            <Users className="mx-auto h-9 w-9" style={{ color: DASH.subtle }} />
            <p className="mt-4 font-semibold" style={{ color: DASH.heading }}>No users found</p>
            <p className="mt-1 text-sm" style={{ color: DASH.muted }}>Try changing the search or filters.</p>
          </div>
        )}
      </div>

      {data && data.pagination.total > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: DASH.muted }}>
            Rows per page
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              disabled={loading}
              className="h-9 rounded-lg border bg-white px-3 text-sm outline-none"
              style={{ borderColor: DASH.border, color: DASH.heading }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="max-w-full overflow-x-auto flex items-center gap-1.5">
            <button aria-label="Previous page" disabled={!data.pagination.hasPrevious || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" style={{ borderColor: DASH.border }}><ChevronLeft className="h-4 w-4" /></button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === data.pagination.page ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(pageNumber)}
                className="h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold disabled:opacity-40"
                style={{
                  borderColor: pageNumber === data.pagination.page ? DASH.plum : DASH.border,
                  backgroundColor: pageNumber === data.pagination.page ? DASH.plum : "white",
                  color: pageNumber === data.pagination.page ? "white" : DASH.heading,
                }}
              >
                {pageNumber}
              </button>
            ))}
            <button aria-label="Next page" disabled={!data.pagination.hasNext || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border bg-white p-2 disabled:opacity-40" style={{ borderColor: DASH.border }}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
