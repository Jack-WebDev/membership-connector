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

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { MemberFilters } from "./_components/member-filters";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	active: "success",
	pending_payment: "pending",
	suspended: "warning",
	expired: "muted",
	cancelled: "danger",
};

const PAYMENT_STATUS_TONES: Record<string, StatusBadgeTone> = {
	paid: "success",
	pending: "pending",
};

const PAGE_SIZE = 20;

type OrganizationMembersPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{
		search?: string;
		status?: string;
		membershipId?: string;
		membershipTierId?: string;
		paymentStatus?: string;
		joinedFrom?: string;
		joinedTo?: string;
		page?: string;
	}>;
};

export default async function OrganizationMembersPage({
	params,
	searchParams,
}: OrganizationMembersPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/members`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "manage_members")) {
		return (
			<ErrorState
				title="You don't have permission to view members"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;

	const [members, filterOptions] = await Promise.all([
		serverTrpcAuthed.membershipMember.adminList.query({
			organizationSlug: orgSlug,
			search: query.search,
			status: query.status as
				| "active"
				| "pending_payment"
				| "expired"
				| "cancelled"
				| "suspended"
				| undefined,
			membershipId: query.membershipId,
			membershipTierId: query.membershipTierId,
			paymentStatus: query.paymentStatus as "paid" | "pending" | undefined,
			joinedFrom: query.joinedFrom ? new Date(query.joinedFrom) : undefined,
			joinedTo: query.joinedTo ? new Date(query.joinedTo) : undefined,
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.membershipMember.adminFilterOptions.query({
			organizationSlug: orgSlug,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(members.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		if (query.membershipTierId)
			params.set("membershipTierId", query.membershipTierId);
		if (query.paymentStatus) params.set("paymentStatus", query.paymentStatus);
		if (query.joinedFrom) params.set("joinedFrom", query.joinedFrom);
		if (query.joinedTo) params.set("joinedTo", query.joinedTo);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Members"
				description="View and manage members across all of your memberships."
			/>

			<MemberFilters
				memberships={filterOptions.memberships}
				tiers={filterOptions.tiers}
			/>

			<DataTable
				title="All members"
				description={`Showing ${members.items.length} of ${members.total} members`}
				columns={[
					{
						id: "member",
						header: "Member",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">
									{row.userName}
								</div>
								<div className="text-muted-foreground text-xs">
									{row.userEmail}
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
						id: "joined",
						header: "Joined",
						cell: (row) => new Date(row.startedAt).toLocaleDateString(),
					},
					{
						id: "paymentStatus",
						header: "Payment status",
						cell: (row) => (
							<StatusBadge
								label={row.paymentStatus}
								tone={PAYMENT_STATUS_TONES[row.paymentStatus] ?? "muted"}
							/>
						),
					},
				]}
				rows={members.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<Button
						size="sm"
						variant="outline"
						render={
							<Link href={`/org/${orgSlug}/members/${row.id}` as Route} />
						}
					>
						View
					</Button>
				)}
				emptyTitle="No members yet"
				emptyDescription="Approved applicants will appear here once they become active members."
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
