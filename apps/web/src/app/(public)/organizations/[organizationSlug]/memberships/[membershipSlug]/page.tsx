import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { PageHeader } from "@membership-connector-app/ui/components/page-header";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";
import { TierPricingCard } from "@membership-connector-app/ui/components/tier-pricing-card";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { toTierPricingCardProps } from "@/lib/membership-presenters";
import { getAuthState } from "@/lib/server-auth";
import { serverTrpc } from "@/utils/trpc-server";

import { MembershipDetailActions } from "./_components/membership-detail-actions";

type MembershipPageProps = {
	params: Promise<{ organizationSlug: string; membershipSlug: string }>;
};

export default async function MembershipPage({ params }: MembershipPageProps) {
	const { organizationSlug, membershipSlug } = await params;

	const membership = await serverTrpc.membership.getPublicBySlug
		.query({ organizationSlug, membershipSlug })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}

			throw error;
		});

	if (!membership) {
		notFound();
	}

	const auth = await getAuthState();
	const authState = !auth.authenticated
		? "anonymous"
		: auth.roles.includes("member")
			? "member"
			: "no-member-role";

	const applyHref = `/organizations/${organizationSlug}/memberships/${membershipSlug}/apply`;

	return (
		<div className="space-y-10">
			<PageHeader
				eyebrow={membership.organizationName}
				title={membership.name}
				description={
					membership.description ?? membership.shortDescription ?? undefined
				}
				actions={
					<MembershipDetailActions
						membershipId={membership.id}
						auth={authState}
					/>
				}
			/>

			<section className="space-y-6">
				<SectionHeader
					eyebrow="Tiers"
					title="Choose the tier that's right for you"
					description="Every tier shown here is currently open for new members."
				/>
				{membership.tiers.length > 0 ? (
					<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
						{membership.tiers.map((tier) => (
							<TierPricingCard
								key={tier.id}
								{...toTierPricingCardProps(tier, {
									href: `${applyHref}?tier=${tier.id}`,
								})}
							/>
						))}
					</div>
				) : (
					<EmptyState
						title="No tiers available"
						description="This membership doesn't have any active tiers right now."
					/>
				)}
			</section>

			<section className="space-y-6">
				<SectionHeader
					eyebrow="Announcements"
					title="Latest updates from this membership"
				/>
				<EmptyState
					title="No announcements yet"
					description="Updates from this membership will show up here."
				/>
			</section>
		</div>
	);
}
