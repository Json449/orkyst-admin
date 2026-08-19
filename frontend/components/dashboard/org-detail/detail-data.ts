import { type Organization } from "../organizations-data";

export type OnboardingStep = { label: string; date?: string };
export type SocialAccount = { name: string; color: string; connected: boolean };
export type ActivityTone = "success" | "info" | "warning" | "brand";
export type ActivityItem = {
  title: string;
  meta: string;
  time: string;
  tone: ActivityTone;
};

export type OrgDetail = {
  description?: string;
  joinedFull: string;
  usage: { posts: number; images: number; reels: number; calendars: number };
  onboardingSteps: OnboardingStep[];
  socials: SocialAccount[];
  activity: ActivityItem[];
};

const MILESTONES = [
  "Account created",
  "Owner verified",
  "Brand setup",
  "Products added",
  "Social accounts connected",
  "First calendar created",
];

const SOCIAL_PLATFORMS = [
  { name: "Instagram", color: "#2563EB" },
  { name: "Facebook", color: "#F97316" },
  { name: "TikTok", color: "#D1D5DB" },
  { name: "LinkedIn", color: "#D1D5DB" },
];

/** Hand-authored detail. Any org without an entry falls back to derived data. */
const DETAILS: Record<string, OrgDetail> = {
  "lotsa-pizza": {
    description:
      "Neapolitan-style pizza chain with 6 branches across Metro Manila. Uses Orkyst for weekly promo calendars and store-level social content.",
    joinedFull: "Jun 14, 2026",
    usage: { posts: 30, images: 3, reels: 17, calendars: 1 },
    onboardingSteps: [
      { label: "Account created", date: "Jun 14" },
      { label: "Owner verified", date: "Jun 14" },
      { label: "Brand setup", date: "Jun 15" },
      { label: "Products added", date: "Jun 15" },
      { label: "Social accounts connected", date: "Jun 16" },
      { label: "First calendar created", date: "Jun 18" },
    ],
    socials: [
      { name: "Instagram", color: "#2563EB", connected: true },
      { name: "Facebook", color: "#F97316", connected: true },
      { name: "TikTok", color: "#D1D5DB", connected: false },
      { name: "LinkedIn", color: "#D1D5DB", connected: false },
    ],
    activity: [
      {
        title: "Connected Instagram",
        meta: "@lotsapizza.ph · Maria Santos",
        time: "2h ago",
        tone: "success",
      },
      {
        title: "Post published to Instagram",
        meta: "“Buy 1 Take 1 — this weekend only” · Maria Santos",
        time: "5h ago",
        tone: "info",
      },
      {
        title: "Reel generated",
        meta: "Weekend deal 15s vertical · Bea Villanueva",
        time: "Aug 1",
        tone: "info",
      },
      {
        title: "Admin View opened",
        meta: "John Doe · read-only session, 12 minutes",
        time: "Aug 7",
        tone: "warning",
      },
      {
        title: "User invited",
        meta: "ramon@lotsapizza.com.ph as Viewer · Maria Santos",
        time: "Aug 5",
        tone: "brand",
      },
    ],
  },
};

/**
 * Detail for orgs with no hand-authored entry.
 *
 * Everything here is derived from the directory row rather than invented:
 * milestones are ticked to match the recorded onboarding percentage, and the
 * activity feed stays empty rather than fabricating customer history.
 */
function derivedDetail(org: Organization): OrgDetail {
  const completed = Math.round((org.onboarding / 100) * MILESTONES.length);

  return {
    joinedFull: `${org.joined}, 2026`,
    usage: {
      posts: org.posts,
      images: org.images,
      reels: 0,
      calendars: org.onboarding === 100 ? 1 : 0,
    },
    onboardingSteps: MILESTONES.slice(0, completed).map((label) => ({ label })),
    socials: SOCIAL_PLATFORMS.map((platform, index) => ({
      ...platform,
      connected: org.posts > 0 && index < 1,
    })),
    activity: [],
  };
}

export function detailFor(org: Organization): OrgDetail {
  return DETAILS[org.slug] ?? derivedDetail(org);
}

export const ONBOARDING_MILESTONE_COUNT = MILESTONES.length;
