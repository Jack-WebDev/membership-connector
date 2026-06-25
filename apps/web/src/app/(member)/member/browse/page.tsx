import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@membership-connector-app/ui/components/pagination";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";
import type { Route } from "next";

import { toMembershipCardProps } from "@/lib/membership-presenters";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { MembershipFilters } from "./_components/membership-filters";

const PAGE_SIZE = 12;

type MemberBrowsePageProps = {
	searchParams: Promise<{
		search?: string;
		category?: string;
		billing?: string;
		pricing?: string;
		org?: string;
		page?: string;
	}>;
};

export default async function MemberBrowsePage({
	searchParams,
}: MemberBrowsePageProps) {
	await requireMemberSession("/member/browse");

	const params = await searchParams;
	const page = Number(params.page) > 0 ? Number(params.page) : 1;

	const [memberships, filterOptions] = await Promise.all([
		serverTrpcAuthed.membership.listPublic.query({
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
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.membership.listFilterOptions.query(),
	]);

	const totalPages = Math.max(1, Math.ceil(memberships.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const query = new URLSearchParams();
		if (params.search) query.set("search", params.search);
		if (params.category) query.set("category", params.category);
		if (params.billing) query.set("billing", params.billing);
		if (params.pricing) query.set("pricing", params.pricing);
		if (params.org) query.set("org", params.org);
		query.set("page", String(targetPage));
		return `?${query}` as Route;
	}

	return (
		<div className="space-y-6">
			<SectionHeader
				eyebrow="Browse"
				title="Find a membership that's right for you"
				description="Use the filters below to narrow things down, or search by name."
			/>
			<MembershipFilters categories={filterOptions.categories} />
			<p className="text-muted-foreground text-sm">
				Showing {memberships.items.length} of {memberships.total} memberships
			</p>
			{memberships.items.length > 0 ? (
				<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{memberships.items.map((membership) => (
						<MembershipCard
							key={membership.id}
							{...toMembershipCardProps(membership, {
								href: `/member/browse/${membership.organizationSlug}/${membership.slug}`,
							})}
						/>
					))}
				</div>
			) : (
				<EmptyState
					title="No memberships match your filters"
					description="Try a different search or clear your filters to see everything available."
				/>
			)}
			{totalPages > 1 ? (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href={buildPageHref(Math.max(1, page - 1))}
								aria-disabled={page <= 1}
							/>
						</PaginationItem>
						<PaginationItem>
							<span className="px-3 text-muted-foreground text-sm">
								Page {page} of {totalPages}
							</span>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext
								href={buildPageHref(Math.min(totalPages, page + 1))}
								aria-disabled={page >= totalPages}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}
		</div>
	);
}
