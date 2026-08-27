import type { AdminUserStatus } from "@/lib/api";

const STATUS_STYLES: Record<AdminUserStatus, { label: string; bg: string; fg: string }> = {
  active: { label: "Active", bg: "#ECFDF5", fg: "#059669" },
  onboarding: { label: "Onboarding", bg: "#EFF6FF", fg: "#2563EB" },
  pending: { label: "Pending", bg: "#FEF3C7", fg: "#B45309" },
  suspended: { label: "Suspended", bg: "#FEE2E2", fg: "#DC2626" },
};

export function UserStatusPill({ status }: { status: AdminUserStatus }) {
  const tone = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {tone.label}
    </span>
  );
}

export function UserPlanPill({ plan }: { plan: string }) {
  const featured = plan.toLowerCase() === "pro";
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-[13px] font-semibold capitalize"
      style={
        featured
          ? { backgroundColor: "#FCE9F1", color: "#8A1253" }
          : { backgroundColor: "#F3F4F6", color: "#4B5563" }
      }
    >
      {plan || "Basic"}
    </span>
  );
}
