"use client";

import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { DASH } from "./theme";

export function DashboardTopbar({ mobileNav }: { mobileNav?: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  };

  return (
    <header
      className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-white px-4 sm:h-[72px] sm:px-6 lg:px-8"
      style={{ borderColor: DASH.border }}
    >
      {mobileNav}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {/* Environment pill */}
        <span
          className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium sm:flex"
          style={{ backgroundColor: DASH.greenBg, color: DASH.green }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Production
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-[#6B6470] transition hover:bg-[#F5F1F5] hover:text-[#7E174F] sm:px-3"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
