"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { AdminUser } from "@/lib/api";
import { DASH } from "../theme";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlanPill, UserStatusPill } from "./user-pills";

const HEAD_CLASS =
  "px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]";

function initials(user: AdminUser) {
  const source = user.fullname || user.email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function UserAvatar({ user }: { user: AdminUser }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = user.avatar?.trim();

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={`${user.fullname || user.email} profile picture`}
        onError={() => setImageFailed(true)}
        className="h-10 w-10 shrink-0 rounded-full border border-white object-cover shadow-sm"
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE9F1] text-xs font-bold text-[#8A1253]">
      {initials(user)}
    </span>
  );
}

export function UsersTable({
  users,
  onAccountStatusChange,
}: {
  users: AdminUser[];
  onAccountStatusChange: (user: AdminUser, active: boolean, code: string) => Promise<void>;
}) {
  const router = useRouter();
  const [changingUserId, setChangingUserId] = useState<string>();
  const [pendingAction, setPendingAction] = useState<{ user: AdminUser; active: boolean } | null>(null);
  const [securityCode, setSecurityCode] = useState("");
  const [securityError, setSecurityError] = useState("");

  async function changeAccountStatus(user: AdminUser, active: boolean) {
    setPendingAction({ user, active });
    setSecurityCode("");
    setSecurityError("");
  }

  async function confirmAccountStatusChange() {
    if (!pendingAction) return;
    const code = securityCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setSecurityError("Enter the 6-digit security code.");
      return;
    }

    const action = pendingAction.active ? "activate" : "deactivate";
    try {
      setChangingUserId(pendingAction.user.id);
      await onAccountStatusChange(pendingAction.user, pendingAction.active, code);
      setPendingAction(null);
      setSecurityCode("");
      setSecurityError("");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : `Unable to ${action} this account.`);
    } finally {
      setChangingUserId(undefined);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: DASH.border }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1140px] border-collapse text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: DASH.border }}>
              <th className={HEAD_CLASS}>User</th>
              <th className={HEAD_CLASS}>Status</th>
              <th className={HEAD_CLASS}>Plan</th>
              <th className={HEAD_CLASS}>Sign in</th>
              <th className={HEAD_CLASS}>Connected</th>
              <th className={HEAD_CLASS}>Joined</th>
              <th className={HEAD_CLASS}>Access</th>
              <th className={HEAD_CLASS} aria-label="Open user" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const deactivated = user.accountStatus === "deactivated";
              const changing = changingUserId === user.id;

              return (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-[#FAFAFB]"
                  style={{ borderColor: DASH.border }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0 leading-tight">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="block max-w-[220px] truncate text-[15px] font-bold hover:underline"
                          style={{ color: DASH.heading }}
                        >
                          {user.fullname || "Unnamed user"}
                        </Link>
                        <div className="mt-1 max-w-[240px] truncate text-[13px]" style={{ color: DASH.muted }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><UserStatusPill status={user.status} /></td>
                  <td className="px-5 py-4"><UserPlanPill plan={user.plan} /></td>
                  <td className="px-5 py-4 text-sm capitalize" style={{ color: DASH.heading }}>{user.provider}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: DASH.heading }}>
                    {user.connectedPlatforms.length ? user.connectedPlatforms.length : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm" style={{ color: DASH.heading }}>{shortDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={Boolean(changingUserId)}
                      onClick={(event) => {
                        event.stopPropagation();
                        void changeAccountStatus(user, deactivated);
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        deactivated
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      {changing ? "Updating…" : deactivated ? "Activate" : "Deactivate"}
                    </button>
                  </td>
                  <td className="px-5 py-4"><ArrowRight className="h-4 w-4" style={{ color: DASH.subtle }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (open) return;
          setPendingAction(null);
          setSecurityCode("");
          setSecurityError("");
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FCE9F3] text-[#A30D70]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle>Confirm account change</DialogTitle>
                <DialogDescription>
                  Enter the 6-digit admin code to {pendingAction?.active ? "activate" : "deactivate"} this account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: DASH.heading }}>
              Security code
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                value={securityCode}
                onChange={(event) => {
                  setSecurityCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setSecurityError("");
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="h-11 pl-10 text-sm"
              />
            </div>
            <p className="text-xs" style={{ color: DASH.muted }}>
              This code is required for both activation and deactivation.
            </p>
            {securityError ? (
              <p role="alert" className="text-sm font-medium text-rose-600">
                {securityError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setPendingAction(null);
                setSecurityCode("");
                setSecurityError("");
              }}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: DASH.border, color: DASH.heading }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmAccountStatusChange()}
              disabled={securityCode.trim().length !== 6 || Boolean(changingUserId)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: DASH.plum }}
            >
              {changingUserId ? "Updating…" : pendingAction?.active ? "Activate account" : "Deactivate account"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
