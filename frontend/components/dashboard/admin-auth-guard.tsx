"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { OrkystLogo } from "@/components/orkyst-logo";
import { fetchAuthMe } from "@/lib/api";

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchAuthMe,
    staleTime: 60_000,
    retry: false,
  });
  const authenticated = authQuery.data?.authenticated === true;

  useEffect(() => {
    if (authQuery.isLoading) return;
    if (!authenticated) router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
  }, [authenticated, authQuery.isLoading, pathname, router]);

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
