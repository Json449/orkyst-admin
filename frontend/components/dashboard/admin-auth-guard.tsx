"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OrkystLogo } from "@/components/orkyst-logo";
import { fetchAuthMe } from "@/lib/api";

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    fetchAuthMe()
      .then((session) => {
        if (!active) return;
        if (!session.authenticated) {
          const next = encodeURIComponent(pathname || "/dashboard");
          router.replace(`/login?next=${next}`);
          return;
        }
        setAuthenticated(true);
      })
      .catch(() => {
        if (active) router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F5F8]">
        <div className="flex flex-col items-center gap-4 text-[#7E174F]">
          <span className="animate-pulse rounded-2xl bg-white px-5 py-3 shadow-sm">
            <OrkystLogo className="h-auto w-32" />
          </span>
          <span className="text-sm font-medium text-[#6B6470]">Verifying administrator session…</span>
        </div>
      </main>
    );
  }

  return children;
}
