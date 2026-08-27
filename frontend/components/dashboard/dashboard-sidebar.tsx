"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  LayoutGrid,
  Menu,
  Users,
  X,
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
  { label: "Users", icon: Users, href: "/dashboard/users" },
];

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
      className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-white md:flex"
      style={{ borderColor: DASH.border }}
    >
      {/* Brand */}
      <div
        className="flex items-center justify-between gap-3 border-b px-6 py-5"
        style={{ borderColor: DASH.border }}
      >
        <OrkystLogo className="h-auto w-[132px]" />
        <span className="rounded-full bg-[#FCE9F1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A0860]">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4">
        <SectionLabel>Platform</SectionLabel>
        <div className="space-y-0.5">
          {PLATFORM_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

/** Collapsible navigation for phones; the permanent sidebar remains desktop-only. */
export function MobileDashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="md:hidden">
      <button type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white" style={{ borderColor: DASH.border, color: DASH.heading }}>
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-[#180A16]/35" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-[min(19rem,86vw)] flex-col bg-white shadow-2xl" style={{ borderColor: DASH.border }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: DASH.border }}>
              <div className="flex items-center gap-2"><OrkystLogo className="h-auto w-28" /><span className="rounded-full bg-[#FCE9F1] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7A0860]">Admin</span></div>
              <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-[#F5F3F7]" style={{ color: DASH.heading }}><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-1 p-3" aria-label="Mobile navigation">
              {PLATFORM_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold" style={{ backgroundColor: active ? DASH.pink : "transparent", color: active ? DASH.plum : DASH.heading }}><Icon className="h-5 w-5" />{item.label}</Link>;
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
