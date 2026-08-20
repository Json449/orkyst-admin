import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { DASH } from "@/components/dashboard/theme";

/**
 * Shell shared by every admin screen under /dashboard.
 *
 * These routes intentionally render without an auth gate so layouts can be
 * iterated on without signing in; `/` and `/admin` still require a session.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: DASH.pageBg }}>
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardTopbar />
        <main className="px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
