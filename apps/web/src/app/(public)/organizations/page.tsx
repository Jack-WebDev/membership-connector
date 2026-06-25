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
import { serverTrpc } from "@/utils/trpc-server";

import { OrganizationSearch } from "./_components/organization-search";

const PAGE_SIZE = 12;

type OrganizationsPageProps = {
	searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function OrganizationsPage({
	searchParams,
}: OrganizationsPageProps) {
	const params = await searchParams;
	const page = Number(params.page) > 0 ? Number(params.page) : 1;

	const organizations = await serverTrpc.organization.listPublic.query({
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
					{organizations.items.map((organization, index) => (
						<div
							key={organization.id}
							style={{ animationDelay: `${index * 80}ms` }}
							className="fade-in slide-in-from-bottom-4 h-full animate-in fill-mode-both duration-500"
						>
							<OrganizationCard
								{...toOrganizationCardProps(organization, {
									href: `/organizations/${organization.slug}`,
								})}
							/>
						</div>
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
