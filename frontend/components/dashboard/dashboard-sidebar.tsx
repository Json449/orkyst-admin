"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LayoutGrid,
  Layers,
  LineChart,
  Network,
  Rocket,
  Settings,
  Users,
} from "lucide-react";
import { OrkystLogo } from "@/components/orkyst-logo";
import { DASH } from "./theme";

type NavItem = {
  label: string;
  icon: typeof LayoutGrid;
  href: string;
  badge?: string;
};

const PLATFORM_NAV: NavItem[] = [
  { label: "Overview", icon: LayoutGrid, href: "/dashboard" },
  { label: "Organizations", icon: Building2, href: "/dashboard/organizations" },
  { label: "Users", icon: Users, href: "#" },
  { label: "Command Centers", icon: Network, href: "#" },
  { label: "Onboarding", icon: Rocket, href: "#", badge: "3" },
  { label: "Analytics", icon: LineChart, href: "#" },
  { label: "Operations", icon: Layers, href: "#" },
];

const CONFIG_NAV: NavItem[] = [{ label: "Settings", icon: Settings, href: "#" }];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-6 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#9CA3AF]">
      {children}
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  if (active) {
    return (
      <div className="relative px-3">
        <span
          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r"
          style={{ backgroundColor: DASH.plum }}
        />
        <Link
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold"
          style={{ backgroundColor: DASH.pink, color: DASH.plum }}
        >
          <Icon className="h-[18px] w-[18px]" />
          {item.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3">
      <Link
        href={item.href}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-[#374151] transition-colors hover:bg-[#F5F3F7]"
      >
        <Icon className="h-[18px] w-[18px] text-[#6B7280]" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: DASH.amberBg, color: DASH.amber }}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  /**
   * Section match: a nav item stays lit on its nested routes, e.g.
   * /dashboard/organizations/new keeps Organizations active. `/dashboard`
   * is exact-only so Overview does not light up for every other section.
   */
  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 flex w-64 flex-col border-r bg-white"
      style={{ borderColor: DASH.border }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 border-b px-6 py-5"
        style={{ borderColor: DASH.border }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: DASH.plum }}
        >
          <OrkystLogo className="h-6 w-6" />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-bold text-[#111827]">orkyst</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
            Admin
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4">
        <SectionLabel>Platform</SectionLabel>
        <div className="space-y-0.5">
          {PLATFORM_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <SectionLabel>Configuration</SectionLabel>
        <div className="space-y-0.5">
          {CONFIG_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>

      {/* Account */}
      <div className="border-t px-4 py-4" style={{ borderColor: DASH.border }}>
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#F5F3F7]">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: DASH.plum }}
          >
            JD
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-[#111827]">
              John Doe
            </span>
            <span className="block truncate text-xs text-[#9CA3AF]">
              Platform Administrator
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
        </button>
      </div>
    </aside>
  );
}
