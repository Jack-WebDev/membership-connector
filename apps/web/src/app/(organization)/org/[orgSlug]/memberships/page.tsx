import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@membership-connector-app/ui/components/pagination";
import { StatCard } from "@membership-connector-app/ui/components/stat-card";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { PlusIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { MembershipFilters } from "./_components/membership-filters";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	draft: "draft",
	published: "published",
	paused: "paused",
	archived: "archived",
};

const PAGE_SIZE = 20;

type MembershipsPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{
		search?: string;
		status?: string;
		visibility?: string;
		page?: string;
	}>;
};

export default async function OrganizationMembershipsPage({
	params,
	searchParams,
}: MembershipsPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/memberships`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "manage_memberships")
	) {
		return (
			<ErrorState
				title="You don't have permission to manage memberships"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;

	const [memberships, stats] = await Promise.all([
		serverTrpcAuthed.membership.adminList.query({
			organizationSlug: orgSlug,
			search: query.search,
			status: query.status as
				| "draft"
				| "published"
				| "paused"
				| "archived"
				| undefined,
			visibility: query.visibility as
				| "public"
				| "private"
				| "invite_only"
				| undefined,
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.membership.adminStats.query({ organizationSlug: orgSlug }),
	]);

	const totalPages = Math.max(1, Math.ceil(memberships.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.visibility) params.set("visibility", query.visibility);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Memberships"
				description="Create and manage the memberships your organization offers. New memberships start as drafts until you publish them."
				actions={
					<Button
						render={<Link href={`/org/${orgSlug}/memberships/new` as Route} />}
					>
						<PlusIcon />
						New membership
					</Button>
				}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Draft" value={stats.draft} />
				<StatCard label="Published" value={stats.published} />
				<StatCard label="Paused" value={stats.paused} />
				<StatCard label="Archived" value={stats.archived} />
			</div>

			<MembershipFilters />

			<DataTable
				title="All memberships"
				description={`Showing ${memberships.items.length} of ${memberships.total} memberships`}
				columns={[
					{
						id: "name",
						header: "Membership",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">{row.name}</div>
								<div className="text-muted-foreground text-xs">/{row.slug}</div>
							</div>
						),
					},
					{
						id: "category",
						header: "Category",
						cell: (row) => row.category ?? "—",
					},
					{
						id: "visibility",
						header: "Visibility",
						cell: (row) => (
							<span className="text-sm capitalize">
								{row.visibility.replace("_", " ")}
							</span>
						),
					},
					{
						id: "status",
						header: "Status",
						cell: (row) => (
							<StatusBadge
								label={row.status}
								tone={STATUS_TONES[row.status] ?? "muted"}
							/>
						),
					},
					{
						id: "tiers",
						header: "Tiers",
						cell: (row) => row.tierCount,
					},
					{
						id: "updated",
						header: "Updated",
						cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
					},
				]}
				rows={memberships.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<Button
						size="sm"
						variant="outline"
						render={
							<Link href={`/org/${orgSlug}/memberships/${row.id}` as Route} />
						}
					>
						Manage
					</Button>
				)}
				emptyTitle="No memberships yet"
				emptyDescription="Create your first membership to start accepting applications."
				pagination={
					totalPages > 1 ? (
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
					) : undefined
				}
			/>
		</div>
	);
}
