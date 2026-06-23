import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
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
import { requireMemberSession } from "@/lib/server-auth";
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

type MemberApplicationsPageProps = {
	searchParams: Promise<{
		search?: string;
		status?: string;
		sortBy?: string;
		sortDir?: string;
		page?: string;
	}>;
};

export default async function MemberApplicationsPage({
	searchParams,
}: MemberApplicationsPageProps) {
	await requireMemberSession("/member/applications");

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;
	const sortBy = query.sortBy === "submittedAt" ? "submittedAt" : "updatedAt";
	const sortDir = query.sortDir === "asc" ? "asc" : "desc";

	const applications =
		await serverTrpcAuthed.membershipApplication.listMine.query({
			search: query.search,
			status: query.status as
				| "draft"
				| "submitted"
				| "under_review"
				| "needs_information"
				| "approved"
				| "rejected"
				| "withdrawn"
				| "cancelled"
				| undefined,
			sortBy,
			sortDir,
			page,
			pageSize: PAGE_SIZE,
		});

	const totalPages = Math.max(1, Math.ceil(applications.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.sortBy) params.set("sortBy", query.sortBy);
		if (query.sortDir) params.set("sortDir", query.sortDir);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	function buildSortHref(column: "submittedAt" | "updatedAt"): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
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
				description="Track the memberships you've applied to and pick up any drafts you haven't finished yet."
			/>

			<ApplicationFilters />

			<DataTable
				title="All applications"
				description={`Showing ${applications.items.length} of ${applications.total} applications`}
				columns={[
					{
						id: "membership",
						header: "Membership",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">
									{row.membershipName}
								</div>
								<div className="text-muted-foreground text-xs">
									{row.organizationName}
								</div>
							</div>
						),
					},
					{
						id: "tier",
						header: "Tier",
						cell: (row) => row.tierName,
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
					<Link
						href={`/member/applications/${row.id}` as Route}
						className="text-primary text-sm hover:underline"
					>
						View
					</Link>
				)}
				emptyTitle="No applications yet"
				emptyDescription="Browse memberships and apply to one to see it listed here."
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
