import type { OrgStatus, Plan } from "./pills";

export type Organization = {
  slug: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  emoji: string;
  plan: Plan;
  owner: string;
  users: number;
  status: OrgStatus;
  /** Onboarding completion, 0–100. */
  onboarding: number;
  posts: number;
  images: number;
  joined: string;
  /** Franchise count, shown inline after the sector for multi-site accounts. */
  franchises?: number;
};

export const ORGANIZATIONS: Organization[] = [
  { slug: "lotsa-pizza", name: "Lots’a Pizza", industry: "Food & Restaurant", country: "Philippines", sector: "Food & Restaurant · Philippines", emoji: "🍕", plan: "Basic", owner: "Carlo Reyes", users: 4, status: "Active", onboarding: 100, posts: 30, images: 3, joined: "Jun 14" },
  { slug: "abc-cosmetics", name: "ABC Cosmetics", industry: "Beauty & Personal Care", country: "United Arab Emirates", sector: "Beauty & Personal Care · UAE", emoji: "💄", plan: "Pro", owner: "Layla Haddad", users: 8, status: "Active", onboarding: 100, posts: 72, images: 168, joined: "May 2" },
  { slug: "xyz-enterprise", name: "XYZ Enterprise", industry: "Retail & Franchise", country: "Pakistan", sector: "Retail & Franchise · Pakistan", emoji: "🏢", plan: "Enterprise", owner: "Sarah Khan", users: 42, status: "Active", onboarding: 100, posts: 312, images: 604, joined: "Feb 18", franchises: 18 },
  { slug: "greenleaf-organics", name: "GreenLeaf Organics", industry: "Food & Restaurant", country: "Canada", sector: "Food & Restaurant · Canada", emoji: "🌿", plan: "Pro", owner: "Daniel Fortin", users: 6, status: "Active", onboarding: 100, posts: 58, images: 96, joined: "Apr 11" },
  { slug: "xyz-media", name: "XYZ Media", industry: "Media & Publishing", country: "Singapore", sector: "Media & Publishing · Singapore", emoji: "📡", plan: "Pro", owner: "Wei Lin Tan", users: 3, status: "Onboarding", onboarding: 67, posts: 4, images: 12, joined: "Aug 1" },
  { slug: "new-brand", name: "New Brand", industry: "Apparel", country: "United States", sector: "Apparel · United States", emoji: "✨", plan: "Basic", owner: "Jordan Ellis", users: 1, status: "Onboarding", onboarding: 40, posts: 0, images: 0, joined: "Aug 6" },
  { slug: "abc-brand", name: "ABC Brand", industry: "Sports & Outdoors", country: "United Kingdom", sector: "Sports & Outdoors · United Kingdom", emoji: "🔵", plan: "Basic", owner: "Priya Raman", users: 0, status: "Pending", onboarding: 10, posts: 0, images: 0, joined: "Aug 8" },
  { slug: "northstar-studio", name: "Northstar Studio", industry: "Marketing Agency", country: "United States", sector: "Marketing Agency · United States", emoji: "⭐", plan: "Pro", owner: "Mia Torres", users: 5, status: "Suspended", onboarding: 100, posts: 26, images: 44, joined: "Mar 9" },
];

export function organizationBySlug(slug: string): Organization | undefined {
  return ORGANIZATIONS.find((org) => org.slug === slug);
}
