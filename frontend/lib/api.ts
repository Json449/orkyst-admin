const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8003";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.detail || `Request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || `Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export type CTAData = {
  metrics: {
    totalLinkClicks: { value: string; change: string };
    siteVisits: { value: string; change: string };
    newAudience: { value: string; change: string };
    avgCtr: { value: string; change: string };
  };
  clicksByContentType: Array<{
    name: string;
    clicks: number;
    ctr: number;
  }>;
};

export type PostsData = {
  engagementTrend: Array<{
    date: string;
    impressions: number;
    engagements: number;
  }>;
  platformDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topPosts: Array<{
    title: string;
    platform: string;
    type: string;
    impressions: string;
    engagements: string;
    engagementRate: string;
  }>;
};

export type SentimentData = {
  sentimentData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  byPlatform: Array<{
    platform: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  keywords: {
    positive: string[];
    negative: string[];
  };
  totalAnalyzed: number;
  trendDeltaPct: number;
  trendLabel: string;
  positivePct: number;
};

export type RecommendationsData = {
  bestDay: string;
  bestTime: string;
  topPlatform: string;
  projectedUpliftPct: number;
  insight: string;
  recommendations: Array<{
    id: string;
    title: string;
    impact: "high" | "medium" | "low" | string;
    description: string;
    metricLabel: string;
  }>;
};

export type AdminUserStatsData = {
  generatedAt: string;
  source: "sample" | "live" | string;
  lookbackDays: number;
  totals: {
    totalUsers: number;
    verifiedUsers: number;
    onboardedUsers: number;
    notOnboardedUsers: number;
    activeUsers30d: number;
    verificationRatePct: number;
    onboardingRatePct: number;
    activeRate30dPct: number;
  };
  signupTrend: Array<{ date: string; count: number }>;
  onboardingTrend: Array<{ date: string; count: number }>;
  providerBreakdown: Array<{ name: string; count: number }>;
  planBreakdown: Array<{ name: string; count: number }>;
  subscriptionBreakdown: Array<{ name: string; count: number }>;
  eventStatusBreakdown: Array<{ name: string; count: number }>;
  contentTypeBreakdown: Array<{ name: string; count: number }>;
  socialConnections: Array<{ platform: string; count: number }>;
  activityTotals: {
    calendars: number;
    posts: number;
    images: number;
    reels: number;
  };
  eventStats: {
    totalEvents: number;
    approvedEvents: number;
    postedEvents: number;
    scheduledEvents: number;
    failedEvents: number;
  };
  recentActivity: Array<{
    id: string;
    kind: "user_signup" | "calendar_created" | "event_created" | string;
    label: string;
    title: string;
    email: string;
    createdAt?: string;
    metadata: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    fullname: string;
    provider: string;
    plan: string;
    billingProvider: string;
    subscriptionStatus: string;
    isVerified: boolean;
    isOnboardingCompleted: boolean;
    createdAt?: string;
    onboardingCompletedAt?: string;
    lastLoginAt?: string;
    connectedPlatforms: string[];
    activityCounts: {
      calendars: number;
      posts: number;
      images: number;
      reels: number;
    };
  }>;
};

export type AuthMeData = {
  authenticated: boolean;
  email?: string | null;
  role?: string | null;
};

export type LoginData = {
  status: number;
  result: {
    email: string;
    role: string;
  };
};

export function fetchCTA() {
  return getJson<CTAData>("/api/analytics/cta");
}

export function fetchPosts() {
  return getJson<PostsData>("/api/analytics/posts");
}

export function fetchSentiment() {
  return getJson<SentimentData>("/api/analytics/sentiment");
}

export function fetchRecommendations() {
  return getJson<RecommendationsData>("/api/analytics/recommendations");
}

export function fetchAdminUserStats() {
  return getJson<AdminUserStatsData>("/api/admin/user-stats");
}

export function login(email: string, password: string) {
  return postJson<LoginData>("/api/auth/login", { email, password });
}

export function logout() {
  return postJson<{ status: number }>("/api/auth/logout");
}

export function fetchAuthMe() {
  return getJson<AuthMeData>("/api/auth/me");
}
