"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { OrkystLogo } from "@/components/orkyst-logo";
import { fetchAuthMe, login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard/users");
  const queryClient = useQueryClient();
  const authQuery = useQuery({ queryKey: ["auth", "session"], queryFn: fetchAuthMe, retry: false });
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "session"] }),
  });

  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
      setNextPath(requestedPath);
    }
  }, [router]);

  useEffect(() => {
    if (!authQuery.data?.authenticated) return;
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    router.replace(requestedPath || "/dashboard");
  }, [authQuery.data?.authenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F5F8] px-6 py-12">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-[#5C0D3C] via-[#7E174F] to-[#AA2B6B]" />
      <div className="absolute left-[12%] top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute right-[12%] top-10 h-64 w-64 rounded-full bg-[#F3B5D5]/20 blur-3xl" />

      <section className="relative w-full max-w-[460px]">
        <div className="mb-6 flex flex-col items-center justify-center gap-2 text-white">
          <span className="rounded-2xl bg-white px-5 py-3 shadow-sm">
            <OrkystLogo className="h-auto w-[160px]" />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">Admin Console</div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_24px_70px_rgba(69,15,48,0.18)] sm:p-10">
          <div className="mb-8">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCEAF3] text-[#7E174F]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17121A]">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B6470]">
              Sign in with your administrator account to manage Orkyst users.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#312B35]">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A919E]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@orkyst.com"
                  className="h-12 w-full rounded-xl border border-[#DDD7E0] bg-white pl-10 pr-4 text-sm text-[#17121A] outline-none transition focus:border-[#8A1253] focus:ring-4 focus:ring-[#8A1253]/10"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#312B35]">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A919E]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-[#DDD7E0] bg-white pl-10 pr-12 text-sm text-[#17121A] outline-none transition focus:border-[#8A1253] focus:ring-4 focus:ring-[#8A1253]/10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#8A818E] hover:bg-[#F5F1F5] hover:text-[#5C0D3C]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div role="alert" className="rounded-xl border border-[#F1B8C5] bg-[#FFF1F3] px-4 py-3 text-sm text-[#A31235]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7E174F] text-sm font-semibold text-white shadow-sm transition hover:bg-[#67113F] focus:outline-none focus:ring-4 focus:ring-[#8A1253]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in to admin"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#8A818E]">
            Protected by an encrypted, HTTP-only administrator session.
          </p>
        </div>
      </section>
    </main>
  );
}
