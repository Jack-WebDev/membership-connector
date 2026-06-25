import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { OrganizationCard } from "@membership-connector-app/ui/components/organization-card";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@membership-connector-app/ui/components/pagination";
import { SectionHeader } from "@membership-connector-app/ui/components/section-header";
import type { Route } from "next";

import { toOrganizationCardProps } from "@/lib/membership-presenters";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { OrganizationSearch } from "./_components/organization-search";

const PAGE_SIZE = 12;

type MemberOrganizationsPageProps = {
	searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function MemberOrganizationsPage({
	searchParams,
}: MemberOrganizationsPageProps) {
	await requireMemberSession("/member/organizations");

	const params = await searchParams;
	const page = Number(params.page) > 0 ? Number(params.page) : 1;

	const organizations = await serverTrpcAuthed.organization.listPublic.query({
		search: params.search,
		page,
		pageSize: PAGE_SIZE,
	});

	const totalPages = Math.max(1, Math.ceil(organizations.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const query = new URLSearchParams();
		if (params.search) query.set("search", params.search);
		query.set("page", String(targetPage));
		return `?${query}` as Route;
	}

	return (
		<div className="space-y-6">
			<SectionHeader
				eyebrow="Organizations"
				title="Groups and memberships you can join"
				description="Browse the organizations below to see what each one offers."
				actions={<OrganizationSearch />}
			/>
			<p className="text-muted-foreground text-sm">
				Showing {organizations.items.length} of {organizations.total}{" "}
				organizations
			</p>
			{organizations.items.length > 0 ? (
				<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{organizations.items.map((organization) => (
						<OrganizationCard
							key={organization.id}
							{...toOrganizationCardProps(organization, {
								href: `/member/organizations/${organization.slug}`,
							})}
						/>
					))}
				</div>
			) : (
				<EmptyState
					title="No organizations match your search"
					description="Try a different search term to find a group or membership."
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
