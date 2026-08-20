/**
 * Palette for the Overview Dashboard screen.
 *
 * Kept local to this screen so it can match the approved design without
 * restyling `/` and `/admin`, which still use the tokens in globals.css.
 */
export const DASH = {
  /** Deep magenta — featured card, avatars, logo mark, activity bars. */
  plum: "#8A1253",
  /** Brighter magenta — inline links and the "Enterprise" plan pill. */
  accent: "#A21C6B",
  /** Tinted pink — active nav pill, icon chips, accent chips. */
  pink: "#FCE9F1",
  pageBg: "#F8F7FA",
  border: "#EAE7EF",
  heading: "#111827",
  muted: "#6B7280",
  subtle: "#9CA3AF",
  green: "#059669",
  greenBg: "#ECFDF5",
  amber: "#B45309",
  amberBg: "#FEF3C7",
} as const;

/** Blue ramp for the onboarding funnel — darkens as the funnel narrows. */
export const FUNNEL_BLUES = ["#93C5FD", "#60A5FA", "#3B82F6", "#1E40AF"] as const;

export const LINE_BLUE = "#3B82F6";
