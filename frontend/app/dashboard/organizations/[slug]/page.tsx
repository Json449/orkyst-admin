import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { organizationBySlug } from "@/components/dashboard/organizations-data";
import { detailFor } from "@/components/dashboard/org-detail/detail-data";
import { OrgHeader } from "@/components/dashboard/org-detail/org-header";
import { OrganizationInformation } from "@/components/dashboard/org-detail/organization-information";
import { OnboardingProgress } from "@/components/dashboard/org-detail/onboarding-progress";
import { UsageSummary } from "@/components/dashboard/org-detail/usage-summary";
import { SocialAccounts } from "@/components/dashboard/org-detail/social-accounts";
import { OrgActivity } from "@/components/dashboard/org-detail/org-activity";
import { DASH } from "@/components/dashboard/theme";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = organizationBySlug(slug);

  if (!org) notFound();

  const detail = detailFor(org);

  return (
    <>
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-[15px]"
        style={{ color: DASH.muted }}
      >
        <Link href="/dashboard/organizations" className="hover:underline">
          Organizations
        </Link>
        <ChevronRight className="h-4 w-4" style={{ color: DASH.subtle }} />
        <span>{org.name}</span>
      </nav>

      <div className="mt-4">
        <OrgHeader org={org} />
      </div>

      <div className="mt-6 space-y-5">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <OrganizationInformation org={org} detail={detail} />
          </div>
          <div className="lg:col-span-5">
            <OnboardingProgress org={org} detail={detail} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <UsageSummary detail={detail} />
          </div>
          <div className="lg:col-span-5">
            <SocialAccounts detail={detail} />
          </div>
        </div>

        <OrgActivity detail={detail} />
      </div>
    </>
  );
}
