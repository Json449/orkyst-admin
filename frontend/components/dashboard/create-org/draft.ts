import type { PermissionLevel, PlanId } from "./plans";

/** Shape collected across the Create Organization wizard. */
export type OrgDraft = {
  name: string;
  website: string;
  industry: string;
  country: string;
  description: string;
  ownerName: string;
  jobTitle: string;
  email: string;
  phone: string;
  /** Whether the invitation email goes out when the wizard completes. */
  inviteOnCreate: boolean;
  plan: PlanId;
  annualBilling: boolean;
  trialPeriod: string;
  billingContact: string;
  /** Standalone workspace, or attached as a franchise under an enterprise. */
  commandCenter: "standalone" | "enterprise";
  parentEnterprise: string;
  permissions: Record<string, PermissionLevel>;
};

export const INDUSTRIES = [
  "Food & Restaurant",
  "Beauty & Personal Care",
  "Retail & Franchise",
  "Media & Publishing",
  "Apparel",
  "Sports & Outdoors",
  "Marketing Agency",
] as const;

export const COUNTRIES = [
  "Philippines",
  "United Arab Emirates",
  "Pakistan",
  "Canada",
  "Singapore",
  "United States",
  "United Kingdom",
] as const;

/** Stands in for a brand logo until the website is crawled on setup. */
export const INDUSTRY_EMOJI: Record<string, string> = {
  "Food & Restaurant": "🍕",
  "Beauty & Personal Care": "💄",
  "Retail & Franchise": "🏢",
  "Media & Publishing": "📡",
  Apparel: "✨",
  "Sports & Outdoors": "🔵",
  "Marketing Agency": "⭐",
};

/** "https://lotsapizza.com.ph/" -> "lotsapizza.com.ph" */
export function domainOf(website: string): string {
  return website.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}
