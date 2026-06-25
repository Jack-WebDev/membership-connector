import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";
import { TierPricingCard } from "@membership-connector-app/ui/components/tier-pricing-card";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import {
	formatMemberStatusLabel,
	formatMemberStatusTone,
	toTierPricingCardProps,
} from "@/lib/membership-presenters";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { MembershipDetailActions } from "./_components/membership-detail-actions";

type MemberMembershipBrowsePageProps = {
	params: Promise<{ organizationSlug: string; membershipSlug: string }>;
};

export default async function MemberMembershipBrowsePage({
	params,
}: MemberMembershipBrowsePageProps) {
	const { organizationSlug, membershipSlug } = await params;

	await requireMemberSession(
		`/member/browse/${organizationSlug}/${membershipSlug}`,
	);

	const membership = await serverTrpcAuthed.membership.getPublicBySlug
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

	const memberStatus =
		await serverTrpcAuthed.membershipApplication.getStatusForMembership.query({
			membershipId: membership.id,
		});

	const applyHref = `/member/browse/${organizationSlug}/${membershipSlug}/apply`;

	return (
		<div className="space-y-10">
			<DashboardHeader
				title={membership.name}
				description={
					membership.description ??
					membership.shortDescription ??
					membership.organizationName
				}
				actions={<MembershipDetailActions membershipId={membership.id} />}
			/>

			<section className="space-y-6">
				<SectionHeader
					eyebrow="Tiers"
					title="Choose the tier that's right for you"
					description="Every tier shown here is currently open for new members."
				/>
				{membership.tiers.length > 0 ? (
					<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
						{membership.tiers.map((tier) => {
							const { currentTier, pendingApplication } = memberStatus;
							const isCurrentTier = currentTier?.membershipTierId === tier.id;
							const isPendingTier =
								pendingApplication?.membershipTierId === tier.id;
							const blocked =
								isCurrentTier || isPendingTier || pendingApplication != null;

							const badgeStatus = isPendingTier
								? pendingApplication?.status
								: isCurrentTier
									? currentTier?.status
									: undefined;

							let actionLabel: string | undefined;
							if (isCurrentTier) {
								actionLabel = "Current tier";
							} else if (isPendingTier) {
								actionLabel = "Already applied";
							} else if (pendingApplication) {
								actionLabel = "Unavailable";
							} else if (currentTier) {
								actionLabel = "Switch to this tier";
							}

							return (
								<TierPricingCard
									key={tier.id}
									{...toTierPricingCardProps(tier, {
										href: blocked ? undefined : `${applyHref}?tier=${tier.id}`,
										disabled: blocked,
										status: badgeStatus
											? formatMemberStatusLabel(badgeStatus)
											: undefined,
										statusTone: badgeStatus
											? formatMemberStatusTone(badgeStatus)
											: undefined,
										actionLabel,
									})}
								/>
							);
						})}
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
