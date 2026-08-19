export type PlanId = "Basic" | "Pro" | "Enterprise";

export type PlanOption = {
  id: PlanId;
  /** Monthly list price in USD. */
  price: number;
  blurb: string;
  features: string[];
  seats: number;
  socialAccounts: string;
  /** Ribbon shown above the card. */
  badge?: string;
  /** Amber caveat rendered inside the card. */
  caveat?: boolean;
};

export const PLANS: PlanOption[] = [
  {
    id: "Basic",
    price: 49,
    blurb:
      "One brand, one team. Where most restaurants and single-location retailers start.",
    features: ["5 seats", "2 social accounts", "50 AI images / mo", "1 Command Center"],
    seats: 5,
    socialAccounts: "2 social accounts",
  },
  {
    id: "Pro",
    price: 199,
    blurb:
      "Adds Reels, AI Studio and advanced analytics. The upgrade most Basic accounts make in month three.",
    features: ["10 seats", "Unlimited social", "500 AI images / mo", "Reels + AI Studio"],
    seats: 10,
    socialAccounts: "Unlimited social",
    badge: "Most adopted",
  },
  {
    id: "Enterprise",
    price: 1450,
    blurb:
      "Corporate parent with franchises underneath. Brand guardrails, approval flows, SSO.",
    features: ["50+ seats", "Unlimited franchises", "SSO + audit log"],
    seats: 50,
    socialAccounts: "Unlimited social",
    caveat: true,
  },
];

export const ANNUAL_DISCOUNT = 0.15;

export function planById(id: PlanId): PlanOption {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

/** Effective monthly rate for the chosen billing cycle. */
export function monthlyRate(plan: PlanOption, annual: boolean): number {
  return annual ? plan.price * (1 - ANNUAL_DISCOUNT) : plan.price;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export const TRIAL_PERIODS = ["14 days", "7 days", "30 days", "No trial"] as const;

export function trialDays(period: string): number {
  const match = period.match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** First charge lands the day the trial ends. */
export function firstChargeDate(period: string): string {
  const date = new Date();
  date.setDate(date.getDate() + trialDays(period));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const PERMISSION_MODULES = [
  "Calendar",
  "Content",
  "Analytics",
  "Social",
  "AI Studio",
  "Settings",
] as const;

export const PERMISSION_LEVELS = ["View", "Edit", "Full"] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];
