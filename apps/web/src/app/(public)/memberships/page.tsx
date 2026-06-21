import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";

import { toMembershipCardProps } from "@/lib/membership-presenters";
import { serverTrpc } from "@/utils/trpc-server";

import { MembershipFilters } from "./_components/membership-filters";

type MembershipsPageProps = {
	searchParams: Promise<{
		search?: string;
		category?: string;
		billing?: string;
		pricing?: string;
		org?: string;
	}>;
};

export default async function MembershipsPage({
	searchParams,
}: MembershipsPageProps) {
	const params = await searchParams;

	const [memberships, filterOptions] = await Promise.all([
		serverTrpc.membership.listPublic.query({
			search: params.search,
			category: params.category,
			billingInterval: params.billing as
				| "free"
				| "once_off"
				| "monthly"
				| "quarterly"
				| "yearly"
				| "custom"
				| undefined,
			pricing: params.pricing as "free" | "paid" | undefined,
			organizationSlug: params.org,
			sort: "newest",
		}),
		serverTrpc.membership.listFilterOptions.query(),
	]);

	return (
		<div className="space-y-6">
			<SectionHeader
				eyebrow="Memberships"
				title="Find a membership that's right for you"
				description="Use the filters below to narrow things down, or search by name. There's no cost to browse."
			/>
			<MembershipFilters categories={filterOptions.categories} />
			<p className="text-muted-foreground text-sm">
				Showing {memberships.length} memberships
			</p>
			{memberships.length > 0 ? (
				<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{memberships.map((membership, index) => (
						<div
							key={membership.id}
							style={{ animationDelay: `${index * 80}ms` }}
							className="fade-in slide-in-from-bottom-4 h-full animate-in fill-mode-both duration-500"
						>
							<MembershipCard
								{...toMembershipCardProps(membership, {
									href: `/organizations/${membership.organizationSlug}/memberships/${membership.slug}`,
								})}
							/>
						</div>
					))}
				</div>
			) : (
				<EmptyState
					title="No memberships match your filters"
					description="Try a different search or clear your filters to see everything available."
				/>
			)}
		</div>
	);
}
