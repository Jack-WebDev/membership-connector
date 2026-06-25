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

import { MembershipFilters } from "./_components/membership-filters";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	active: "success",
	pending_payment: "pending",
	expired: "muted",
	cancelled: "muted",
	suspended: "warning",
};

const STATUS_LABELS: Record<string, string> = {
	active: "Active",
	pending_payment: "Awaiting payment",
	expired: "Expired",
	cancelled: "Cancelled",
	suspended: "Suspended",
};

const PAGE_SIZE = 20;

type MemberMembershipsPageProps = {
	searchParams: Promise<{
		search?: string;
		status?: string;
		sortBy?: string;
		sortDir?: string;
		page?: string;
	}>;
};

export default async function MemberMembershipsPage({
	searchParams,
}: MemberMembershipsPageProps) {
	await requireMemberSession("/member/memberships");

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;
	const sortBy = query.sortBy === "expiresAt" ? "expiresAt" : "startedAt";
	const sortDir = query.sortDir === "asc" ? "asc" : "desc";

	const memberships = await serverTrpcAuthed.membershipMember.listMine.query({
		search: query.search,
		status: query.status as
			| "active"
			| "pending_payment"
			| "expired"
			| "cancelled"
			| "suspended"
			| undefined,
		sortBy,
		sortDir,
		page,
		pageSize: PAGE_SIZE,
	});

	const totalPages = Math.max(1, Math.ceil(memberships.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.sortBy) params.set("sortBy", query.sortBy);
		if (query.sortDir) params.set("sortDir", query.sortDir);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	function buildSortHref(column: "startedAt" | "expiresAt"): Route {
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
			<MembershipFilters />

			<DataTable
				title="All memberships"
				description={`Showing ${memberships.items.length} of ${memberships.total} memberships`}
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
								label={STATUS_LABELS[row.status] ?? row.status}
								tone={STATUS_TONES[row.status] ?? "muted"}
							/>
						),
					},
					{
						id: "started",
						header: (
							<SortableHeader
								label="Started"
								href={buildSortHref("startedAt")}
								active={sortBy === "startedAt"}
								direction={sortDir}
							/>
						),
						cell: (row) => new Date(row.startedAt).toLocaleDateString(),
					},
					{
						id: "expiry",
						header: (
							<SortableHeader
								label="Expiry"
								href={buildSortHref("expiresAt")}
								active={sortBy === "expiresAt"}
								direction={sortDir}
							/>
						),
						cell: (row) =>
							row.expiresAt
								? new Date(row.expiresAt).toLocaleDateString()
								: "—",
					},
				]}
				rows={memberships.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<Link
						href={`/member/memberships/${row.membershipId}` as Route}
						className="text-primary text-sm hover:underline"
					>
						View
					</Link>
				)}
				emptyTitle="No memberships yet"
				emptyDescription="Browse memberships and apply to one to see it listed here once you're approved."
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
