"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fetchAdminOrganization } from "@/lib/api";
import { OrgHeader } from "@/components/dashboard/org-detail/org-header";
import { OrganizationInformation } from "@/components/dashboard/org-detail/organization-information";
import { OnboardingProgress } from "@/components/dashboard/org-detail/onboarding-progress";
import { UsageSummary } from "@/components/dashboard/org-detail/usage-summary";
import { SocialAccounts } from "@/components/dashboard/org-detail/social-accounts";
import { OrgActivity } from "@/components/dashboard/org-detail/org-activity";
import { DASH } from "@/components/dashboard/theme";

export default function OrganizationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const organizationQuery = useQuery({
    queryKey: ["admin", "organization", slug],
    queryFn: () => fetchAdminOrganization(slug),
  });
  const data = organizationQuery.data;
  const error = organizationQuery.error instanceof Error ? organizationQuery.error.message : "Unable to load organization";

  if (organizationQuery.isError) return <div className="rounded-2xl border bg-white px-6 py-14 text-center" style={{ borderColor: DASH.border, color: DASH.heading }}>{error}</div>;
  if (!data) return <div className="h-72 animate-pulse rounded-2xl bg-[#F3F1F5]" />;

  const { organization: org, detail } = data;
  return (
    <>
      <nav className="flex items-center gap-2 text-[15px]" style={{ color: DASH.muted }}>
        <Link href="/dashboard/organizations" className="hover:underline">Organizations</Link>
        <ChevronRight className="h-4 w-4" style={{ color: DASH.subtle }} />
        <span>{org.name}</span>
      </nav>
      <div className="mt-4"><OrgHeader org={org} /></div>
      <div className="mt-6 space-y-5">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7"><OrganizationInformation org={org} detail={detail} /></div>
          <div className="lg:col-span-5"><OnboardingProgress org={org} detail={detail} /></div>
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7"><UsageSummary detail={detail} /></div>
          <div className="lg:col-span-5"><SocialAccounts detail={detail} /></div>
        </div>
        <OrgActivity detail={detail} />
      </div>
    </>
  );
}
