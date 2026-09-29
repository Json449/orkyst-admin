"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Send, ShieldCheck, UserRound } from "lucide-react";
import { OrkystLogo } from "@/components/orkyst-logo";
import { DASH } from "@/components/dashboard/theme";
import { sendOnboardingEmail } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const fields = [
  ["email", "Recipient email", "email"],
  ["temporary_password", "Temporary password", "text"],
  ["team_name", "Team name", "text"],
  ["login_url", "Login URL", "url"],
] as const;

export default function OnboardingPage() {
  const [form, setForm] = useState({ email: "", temporary_password: "", login_url: "https://app.orkyst.com/", team_name: "Sukli" });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [securityError, setSecurityError] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSecurityCode("");
    setSecurityError("");
    setConfirmOpen(true);
  }

  async function confirmSend() {
    if (!/^\d{6}$/.test(securityCode)) {
      setSecurityError("Enter the 6-digit security code.");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      await sendOnboardingEmail({ ...form, code: securityCode });
      setMessage("Onboarding email sent successfully.");
      setConfirmOpen(false);
      setSecurityCode("");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to send email.");
    } finally {
      setSending(false);
    }
  }

  const team = form.team_name || "Sukli";
  const email = form.email || "recipient@example.com";
  const password = form.temporary_password || "Temporary password";
  const loginUrl = form.login_url || "https://app.orkyst.com/";

  return (
    <div className="max-w-[1320px]">
      <h1 className="text-3xl font-bold" style={{ color: DASH.heading }}>Onboarding</h1>
      <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>Create and preview the exact welcome email your new user will receive.</p>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: DASH.border }}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE9F3] text-[#8A1253]"><Mail className="h-5 w-5" /></span>
            <div><h2 className="font-bold" style={{ color: DASH.heading }}>Send onboarding email</h2><p className="text-xs" style={{ color: DASH.muted }}>All fields appear in the live preview.</p></div>
          </div>
          {fields.map(([key, label, type]) => (
            <label key={key} className="mb-4 block">
              <span className="mb-1.5 block text-sm font-semibold" style={{ color: DASH.heading }}>{label}</span>
              <input required value={form[key]} onChange={(event) => update(key, event.target.value)} type={type} className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-[#8A1253]/15" style={{ borderColor: DASH.border }} />
            </label>
          ))}
          <button disabled={sending} className="mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: DASH.plum }}><Send className="h-4 w-4" />{sending ? "Sending…" : "Send onboarding email"}</button>
          {message && <p className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: message.includes("successfully") ? "#15803D" : "#B91C1C" }}>{message.includes("successfully") && <CheckCircle2 className="h-4 w-4" />}{message}</p>}
        </form>

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: DASH.border }}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: DASH.border }}>
            <div><p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: DASH.plum }}>Recipient preview</p><p className="mt-0.5 text-xs" style={{ color: DASH.muted }}>This mirrors the email your user will see.</p></div>
            <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-[11px] font-bold text-[#15803D]">Live preview</span>
          </div>

          <div className="relative overflow-hidden bg-white px-4 py-10 sm:px-8">
            <div className="pointer-events-none absolute -left-24 -top-28 h-60 w-60 rounded-full bg-[#F4DDEC]/70" /><div className="pointer-events-none absolute -bottom-28 -right-24 h-60 w-60 rounded-full bg-[#F1D7EA]/70" />
            <div className="relative mx-auto max-w-[650px] text-[#25264B]">
              <div className="flex justify-center"><OrkystLogo className="h-auto w-56" /></div>
              <div className="mt-8 text-center"><span className="inline-flex rounded-full bg-gradient-to-r from-[#F8EAF4] to-[#F3DDEC] px-7 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8A1253]">Welcome aboard</span><h2 className="mt-5 text-[30px] font-extrabold leading-tight text-[#171832] sm:text-[36px]">Your Orkyst account is ready</h2></div>
              <div className="mt-8 text-[15px] leading-7"><p>Hi <strong className="text-[#8A1253]">{team} Team,</strong></p><p className="mt-3">Welcome to Orkyst! Your workspace has been prepared<br className="hidden sm:block" /> and is ready for onboarding.</p></div>
              <div className="mt-7 rounded-2xl border border-[#E8D6E5] bg-gradient-to-br from-white to-[#FCF6FA] p-5 sm:p-7">
                <div className="flex items-center gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7E5F1] text-[#8A1253]"><UserRound className="h-5 w-5" /></span><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A1253]">Your login details</p></div>
                <div className="mt-4 flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E8D6E5] text-[#8A1253]"><Mail className="h-5 w-5" /></span><div><p className="text-xs text-[#595B83]">Email</p><p className="mt-0.5 break-all text-sm font-extrabold text-[#24254B]">{email}</p></div></div>
                <div className="my-4 h-px bg-[#E9DFE8]" />
                <div className="flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7E5F1] text-[#8A1253]"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-xs text-[#595B83]">Temporary Password</p><p className="mt-0.5 break-all text-sm font-extrabold tracking-wide text-[#24254B]">{password}</p></div></div>
              </div>
              <div className="py-7 text-center"><span className="inline-flex min-w-64 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#8A006E] to-[#A30072] px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#8A1253]/15">Log in to Orkyst <ArrowRight className="h-5 w-5" /></span><p className="mt-3 break-all text-xs font-semibold text-[#8A1253] underline">{loginUrl}</p></div>
              <div className="flex items-center gap-5 rounded-2xl bg-gradient-to-r from-[#FDF5FA] to-[#FAEDF6] p-5"><ShieldCheck className="h-9 w-9 shrink-0 text-[#8A1253]" /><div className="border-l-2 border-[#E7BBD8] pl-5"><p className="text-sm font-extrabold text-[#8A1253]">Important security step</p><p className="mt-1 text-xs leading-5 text-[#55577E]">After signing in, please update your temporary password from <strong>Profile Settings → Change Password.</strong></p></div></div>
              <p className="mt-8 text-sm leading-7">Explore the platform and familiarize yourself with your workspace.<br />We’re looking forward to working with the {team} team.</p><p className="mt-7 text-sm leading-6">Best regards,<br /><strong>The Orkyst Team</strong></p>
              <div className="mt-8 border-t border-[#E7E0E7] pt-5 text-center text-[10px] text-[#8586A0]">© 2026 Orkyst. All rights reserved.</div>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!sending) { setConfirmOpen(open); if (!open) { setSecurityCode(""); setSecurityError(""); } } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE9F3] text-[#A30D70]"><ShieldCheck className="h-5 w-5" /></span>
              <div><DialogTitle>Confirm onboarding email</DialogTitle><DialogDescription>Enter the same 6-digit admin code used for account activation and deactivation.</DialogDescription></div>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: DASH.heading }}>Security code</label>
            <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" /><Input value={securityCode} onChange={(event) => { setSecurityCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setSecurityError(""); }} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="h-11 pl-10 text-sm" /></div>
            <p className="text-xs" style={{ color: DASH.muted }}>The email will be sent to <strong>{email}</strong> after confirmation.</p>
            {securityError && <p role="alert" className="text-sm font-medium text-rose-600">{securityError}</p>}
          </div>
          <DialogFooter><button type="button" onClick={() => setConfirmOpen(false)} disabled={sending} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: DASH.border, color: DASH.heading }}>Cancel</button><button type="button" onClick={() => void confirmSend()} disabled={securityCode.length !== 6 || sending} className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: DASH.plum }}>{sending ? "Sending…" : "Confirm and send"}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
