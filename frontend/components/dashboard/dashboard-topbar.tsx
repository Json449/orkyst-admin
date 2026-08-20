"use client";

import { Bell, Search } from "lucide-react";
import { DASH } from "./theme";

export function DashboardTopbar() {
  return (
    <header
      className="sticky top-0 z-10 flex h-[72px] items-center gap-4 border-b bg-white px-8"
      style={{ borderColor: DASH.border }}
    >
      {/* Search */}
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="search"
          placeholder="Search organizations, users, command centers…"
          className="h-11 w-full rounded-xl border bg-white pl-10 pr-16 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#8A1253]/15"
          style={{ borderColor: DASH.border }}
        />
        <kbd
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-[#9CA3AF]"
          style={{ borderColor: DASH.border }}
        >
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Environment pill */}
        <span
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium"
          style={{ backgroundColor: DASH.greenBg, color: DASH.green }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Production
        </span>

        {/* Notifications */}
        <button className="relative text-[#4B5563] transition-colors hover:text-[#111827]">
          <Bell className="h-[22px] w-[22px]" />
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Account */}
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold text-white"
          style={{ backgroundColor: DASH.plum }}
        >
          JD
        </span>
      </div>
    </header>
  );
}
