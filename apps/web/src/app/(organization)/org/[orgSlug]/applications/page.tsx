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
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import type { Route } from "next";
import Link from "next/link";

import { SortableHeader } from "@/components/data-table/sortable-header";
import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { ApplicationFilters } from "./_components/application-filters";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	draft: "draft",
	submitted: "pending",
	under_review: "info",
	needs_information: "warning",
	approved: "success",
	rejected: "danger",
	withdrawn: "muted",
	cancelled: "muted",
};

const PAGE_SIZE = 20;

type OrganizationApplicationsPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{
		search?: string;
		status?: string;
		membershipId?: string;
		membershipTierId?: string;
		submittedFrom?: string;
		submittedTo?: string;
		sortBy?: string;
		sortDir?: string;
		page?: string;
	}>;
};

export default async function OrganizationApplicationsPage({
	params,
	searchParams,
}: OrganizationApplicationsPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/applications`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "view_applications")
	) {
		return (
			<ErrorState
				title="You don't have permission to view applications"
				description="Ask an organization owner or admin to grant you the reviewer role."
			/>
		);
	}

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;
	const sortBy = query.sortBy === "submittedAt" ? "submittedAt" : "updatedAt";
	const sortDir = query.sortDir === "asc" ? "asc" : "desc";

	const [applications, filterOptions] = await Promise.all([
		serverTrpcAuthed.membershipApplication.adminList.query({
			organizationSlug: orgSlug,
			search: query.search,
			status: query.status as
				| "submitted"
				| "under_review"
				| "needs_information"
				| "approved"
				| "rejected"
				| "withdrawn"
				| "cancelled"
				| undefined,
			membershipId: query.membershipId,
			membershipTierId: query.membershipTierId,
			submittedFrom: query.submittedFrom
				? new Date(query.submittedFrom)
				: undefined,
			submittedTo: query.submittedTo ? new Date(query.submittedTo) : undefined,
			sortBy,
			sortDir,
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.membershipApplication.adminFilterOptions.query({
			organizationSlug: orgSlug,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(applications.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		if (query.membershipTierId)
			params.set("membershipTierId", query.membershipTierId);
		if (query.submittedFrom) params.set("submittedFrom", query.submittedFrom);
		if (query.submittedTo) params.set("submittedTo", query.submittedTo);
		if (query.sortBy) params.set("sortBy", query.sortBy);
		if (query.sortDir) params.set("sortDir", query.sortDir);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	function buildSortHref(column: "submittedAt" | "updatedAt"): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		if (query.membershipTierId)
			params.set("membershipTierId", query.membershipTierId);
		if (query.submittedFrom) params.set("submittedFrom", query.submittedFrom);
		if (query.submittedTo) params.set("submittedTo", query.submittedTo);
		params.set("sortBy", column);
		params.set(
			"sortDir",
			sortBy === column && sortDir === "desc" ? "asc" : "desc",
		);
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Applications"
				description="Review submitted applications, request more information, and approve or reject members."
			/>

			<ApplicationFilters
				memberships={filterOptions.memberships}
				tiers={filterOptions.tiers}
			/>

			<DataTable
				title="All applications"
				description={`Showing ${applications.items.length} of ${applications.total} applications`}
				columns={[
					{
						id: "applicant",
						header: "Applicant",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">
									{row.applicantName || "—"}
								</div>
								<div className="text-muted-foreground text-xs">
									{row.applicantEmail || "—"}
								</div>
							</div>
						),
					},
					{
						id: "membership",
						header: "Membership",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">
									{row.membershipName}
								</div>
								<div className="text-muted-foreground text-xs">
									{row.tierName}
								</div>
							</div>
						),
					},
					{
						id: "status",
						header: "Status",
						cell: (row) => (
							<StatusBadge
								label={row.status.replace("_", " ")}
								tone={STATUS_TONES[row.status] ?? "muted"}
							/>
						),
					},
					{
						id: "submitted",
						header: (
							<SortableHeader
								label="Submitted"
								href={buildSortHref("submittedAt")}
								active={sortBy === "submittedAt"}
								direction={sortDir}
							/>
						),
						cell: (row) =>
							row.submittedAt
								? new Date(row.submittedAt).toLocaleDateString()
								: "—",
					},
					{
						id: "updated",
						header: (
							<SortableHeader
								label="Updated"
								href={buildSortHref("updatedAt")}
								active={sortBy === "updatedAt"}
								direction={sortDir}
							/>
						),
						cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
					},
				]}
				rows={applications.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<Button
						size="sm"
						variant="outline"
						render={
							<Link href={`/org/${orgSlug}/applications/${row.id}` as Route} />
						}
					>
						View
					</Button>
				)}
				emptyTitle="No applications yet"
				emptyDescription="Submitted applications will appear here for review."
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
