import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import { PageHeader } from "@membership-connector-app/ui/components/page-header";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { toMembershipCardProps } from "@/lib/membership-presenters";
import { serverTrpc } from "@/utils/trpc-server";

type OrganizationPageProps = {
	params: Promise<{ organizationSlug: string }>;
};

export default async function OrganizationPage({
	params,
}: OrganizationPageProps) {
	const { organizationSlug } = await params;

	const organization = await serverTrpc.organization.getPublicBySlug
		.query({ organizationSlug })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}

			throw error;
		});

	if (!organization) {
		notFound();
	}

	return (
		<div className="space-y-10">
			<PageHeader
				eyebrow="Organization"
				title={organization.name}
				description={organization.description ?? undefined}
			/>

			<section className="space-y-6">
				<SectionHeader
					eyebrow="Memberships"
					title={`Memberships from ${organization.name}`}
					description="Browse the memberships this organization currently offers."
				/>
				{organization.memberships.length > 0 ? (
					<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
						{organization.memberships.map((membership) => (
							<MembershipCard
								key={membership.id}
								{...toMembershipCardProps(membership, {
									href: `/organizations/${organization.slug}/memberships/${membership.slug}`,
								})}
							/>
						))}
					</div>
				) : (
					<EmptyState
						title="No memberships yet"
						description="This organization hasn't published any memberships yet."
					/>
				)}
			</section>
		</div>
	);
}
