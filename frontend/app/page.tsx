"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrkystLogo } from "@/components/orkyst-logo";
import { CTAPerformanceWidget } from "@/components/analytics/cta-performance-widget";
import { PostsPerformanceWidget } from "@/components/analytics/posts-performance-widget";
import { SentimentWidget } from "@/components/analytics/sentiment-widget";
import { AIRecommendationsWidget } from "@/components/analytics/ai-recommendations-widget";
import { CalendarDays, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrkystLoader } from "@/components/ui/orkyst-loader";
import { fetchAuthMe, logout } from "@/lib/api";

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetchAuthMe()
      .then((session) => {
        if (!session.authenticated) {
          router.replace("/login?next=/");
          return;
        }
        setAuthenticated(true);
        setCheckingAuth(false);
      })
      .catch(() => router.replace("/login?next=/"))
  }, [router]);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    router.replace("/login?next=/");
  };

  if (checkingAuth || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <OrkystLoader label="Loading analytics" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-primary">
                <OrkystLogo className="h-9 w-9" />
              </div>
              <span className="text-xl font-semibold text-foreground">orkyst</span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              <a
                href="#"
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Calendar
              </a>
              <a
                href="#"
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Content
              </a>
              <a
                href="#"
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                Analytics
              </a>
              <a
                href="#"
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Settings
              </a>
              <Link
                href="/admin"
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Admin
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </nav>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your marketing performance and get AI-powered insights
            </p>
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <CalendarDays className="h-4 w-4" />
            Last 30 days
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Waterfall Sections */}
        <div className="space-y-10">
          {/* 1. CTA Performance */}
          <section>
            <CTAPerformanceWidget />
          </section>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* 2. Post Performance */}
          <section>
            <PostsPerformanceWidget />
          </section>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* 3. Sentiment Analysis */}
          <section>
            <SentimentWidget />
          </section>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* 4. AI Recommendations */}
          <section>
            <AIRecommendationsWidget />
          </section>
        </div>
      </main>
    </div>
  );
}
