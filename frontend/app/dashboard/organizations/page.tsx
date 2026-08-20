"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search } from "lucide-react";
import {
  ORGANIZATIONS,
  OrganizationsTable,
} from "@/components/dashboard/organizations-table";
import type { OrgStatus } from "@/components/dashboard/pills";
import { DASH } from "@/components/dashboard/theme";

const TABS: Array<"All" | OrgStatus> = [
  "All",
  "Active",
  "Onboarding",
  "Pending",
  "Suspended",
];

export default function OrganizationsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () =>
      TABS.reduce<Record<string, number>>((acc, key) => {
        acc[key] =
          key === "All"
            ? ORGANIZATIONS.length
            : ORGANIZATIONS.filter((org) => org.status === key).length;
        return acc;
      }, {}),
    [],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ORGANIZATIONS.filter((org) => {
      const matchesTab = tab === "All" || org.status === tab;
      const matchesQuery =
        !needle ||
        org.name.toLowerCase().includes(needle) ||
        org.sector.toLowerCase().includes(needle);
      return matchesTab && matchesQuery;
    });
  }, [tab, query]);

  return (
    <>
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[36px] font-bold leading-tight tracking-tight"
            style={{ color: DASH.heading }}
          >
            Organizations
          </h1>
          <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>
            Every customer account on Orkyst.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            className="rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FAFAFB]"
            style={{ borderColor: DASH.border, color: DASH.heading }}
          >
            Export
          </button>
          <Link
            href="/dashboard/organizations/new"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: DASH.plum }}
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-[390px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search organizations…"
            className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-center text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#8A1253]/15"
            style={{ borderColor: DASH.border }}
          />
        </div>

        {/* Status tabs */}
        <div
          className="flex items-center gap-1 rounded-xl border bg-white p-1"
          style={{ borderColor: DASH.border }}
        >
          {TABS.map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm transition-colors ${
                  active ? "font-bold shadow-sm" : "hover:bg-[#FAFAFB]"
                }`}
                style={
                  active
                    ? { backgroundColor: "#FFFFFF", color: DASH.heading }
                    : { color: DASH.muted }
                }
              >
                {key}
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: active ? DASH.plum : DASH.subtle }}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {["All plans", "Sort: Recent"].map((label) => (
            <button
              key={label}
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm transition-colors hover:bg-[#FAFAFB]"
              style={{ borderColor: DASH.border, color: DASH.heading }}
            >
              {label}
              <ChevronDown className="h-4 w-4" style={{ color: DASH.muted }} />
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="mt-6 text-sm" style={{ color: DASH.muted }}>
        Showing{" "}
        <span className="font-bold" style={{ color: DASH.heading }}>
          {rows.length}
        </span>{" "}
        of {ORGANIZATIONS.length} organizations
      </p>

      <div className="mt-4">
        <OrganizationsTable rows={rows} />
      </div>
    </>
  );
}
