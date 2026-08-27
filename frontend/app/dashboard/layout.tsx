import type { ReactNode } from "react";
import { DashboardSidebar, MobileDashboardNav } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { AdminAuthGuard } from "@/components/dashboard/admin-auth-guard";
import { DASH } from "@/components/dashboard/theme";

/**
 * Shell shared by every admin screen under /dashboard.
 *
 * Every dashboard route requires a valid administrator session.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: DASH.pageBg }}>
        <DashboardSidebar />
        <div className="min-w-0 md:pl-64">
          <DashboardTopbar mobileNav={<MobileDashboardNav />} />
          <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
