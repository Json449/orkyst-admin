import type { Organization } from "@/components/dashboard/organizations-data";
import type { OrgDetail } from "@/components/dashboard/org-detail/detail-data";

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

export type AdminUserStatus = "active" | "onboarding" | "pending" | "suspended";

export type AdminUser = {
  id: string;
  email: string;
  fullname: string;
  company: string;
  avatar?: string | null;
  accountStatus?: "active" | "deactivated";
  provider: string;
  plan: string;
  billingProvider: string;
  subscriptionStatus: string;
  status: AdminUserStatus;
  isVerified: boolean;
  isOnboardingCompleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  onboardingCompletedAt?: string | null;
  lastLoginAt?: string | null;
  subscriptionCurrentPeriodStart?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  connectedPlatforms: string[];
  activityCounts: {
    calendars: number;
    posts: number;
    images: number;
    reels: number;
  };
};

export type AdminUsersData = {
  items: AdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  statusCounts: Record<"all" | AdminUserStatus, number>;
};

export type AdminOrganizationsData = {
  items: Organization[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  statusCounts: Record<"all" | "active" | "onboarding" | "pending" | "suspended", number>;
};

export type AdminOrganizationDetailData = {
  organization: Organization;
  detail: OrgDetail;
};

export type AdminUserDetail = AdminUser & {
  recentActivity: Array<{
    id: string;
    type: "calendar" | "event" | string;
    label?: string;
    title: string;
    status?: string;
    platform?: string;
    createdAt?: string | null;
  }>;
};

export type AdminUserAnalyticsAsset = {
  id: string;
  title: string;
  contentType: "post" | "artwork" | "reel" | "asset" | string;
  mediaKind: "image" | "video" | "link" | "text" | string;
  url?: string | null;
  thumbnailUrl?: string | null;
  postUrl?: string | null;
  createdAt?: string | null;
  status: string;
  platform?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
};

export type AdminUserAnalyticsActivity = {
  id: string;
  activityType: string;
  title: string;
  description: string;
  createdAt: string;
  platform?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  status?: string | null;
};

type AnalyticsPagination = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminUserAnalyticsData = {
  user: {
    id: string;
    fullname: string;
    email: string;
    lastActiveAt?: string | null;
  };
  metrics: {
    posts: number;
    images: number;
    reels: number;
    calendars: number;
    aiGenerationsEdits: number;
    socialActivity: number;
  };
  contentTimeline: Array<{
    date: string;
    posts: number;
    images: number;
    reels: number;
    calendars: number;
  }>;
  recentActions: AdminUserAnalyticsActivity[];
  gallery: AdminUserAnalyticsAsset[];
  galleryCounts: Record<"all" | "post" | "artwork" | "reel" | "asset", number>;
  galleryPagination: AnalyticsPagination;
  activity: AdminUserAnalyticsActivity[];
  activityPagination: AnalyticsPagination;
  filterOptions: {
    contentTypes: string[];
    activityTypes: string[];
    platforms: string[];
    campaigns: Array<{ id: string; name: string }>;
  };
};

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
  source: "live" | string;
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

export type AdminRecentActivityItem = {
  id: string;
  kind: string;
  label: string;
  title: string;
  email: string;
  createdAt?: string;
  metadata: string;
};

export type AdminRecentActivityData = {
  generatedAt: string;
  source: "live" | string;
  items: AdminRecentActivityItem[];
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

export function fetchAdminRecentActivity(limit = 20) {
  return getJson<AdminRecentActivityData>(`/api/admin/recent-activity?limit=${limit}`);
}

export function fetchAdminUsers(filters: {
  query?: string;
  status?: string;
  plan?: string;
  provider?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.plan && filters.plan !== "all") params.set("plan", filters.plan);
  if (filters.provider && filters.provider !== "all") params.set("provider", filters.provider);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  const query = params.toString();
  return getJson<AdminUsersData>(`/api/admin/users${query ? `?${query}` : ""}`);
}

export function fetchAdminUser(userId: string) {
  return getJson<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}`);
}

export function setAdminUserAccountStatus(userId: string, active: boolean) {
  return postJson<AdminUser>(
    `/api/admin/users/${encodeURIComponent(userId)}/account-status`,
    { active },
  );
}

export function fetchAdminUserAnalytics(userId: string, filters: {
  dateFrom?: string;
  dateTo?: string;
  contentType?: string;
  activityType?: string;
  platform?: string;
  campaignId?: string;
  galleryPage?: number;
  galleryPageSize?: number;
  activityPage?: number;
  activityPageSize?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.contentType && filters.contentType !== "all") params.set("content_type", filters.contentType);
  if (filters.activityType && filters.activityType !== "all") params.set("activity_type", filters.activityType);
  if (filters.platform && filters.platform !== "all") params.set("platform", filters.platform);
  if (filters.campaignId && filters.campaignId !== "all") params.set("campaign_id", filters.campaignId);
  params.set("gallery_page", String(filters.galleryPage || 1));
  params.set("gallery_page_size", String(filters.galleryPageSize || 12));
  params.set("activity_page", String(filters.activityPage || 1));
  params.set("activity_page_size", String(filters.activityPageSize || 20));
  return getJson<AdminUserAnalyticsData>(`/api/admin/users/${encodeURIComponent(userId)}/analytics?${params.toString()}`);
}

export function fetchAdminOrganizations(filters: {
  query?: string;
  status?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.plan && filters.plan !== "all") params.set("plan", filters.plan);
  params.set("page", String(filters.page || 1));
  params.set("page_size", String(filters.pageSize || 10));
  return getJson<AdminOrganizationsData>(`/api/admin/organizations?${params.toString()}`);
}

export function fetchAdminOrganization(slug: string) {
  return getJson<AdminOrganizationDetailData>(`/api/admin/organizations/${encodeURIComponent(slug)}`);
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
