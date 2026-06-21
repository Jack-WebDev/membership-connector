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

import { TierFilters } from "./_components/tier-filters";
import { TierRowActions } from "./_components/tier-row-actions";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	active: "active",
	inactive: "muted",
	archived: "archived",
};

const PAGE_SIZE = 20;

type MembershipTiersPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{
		search?: string;
		status?: string;
		membershipId?: string;
		page?: string;
	}>;
};

export default async function MembershipTiersPage({
	params,
	searchParams,
}: MembershipTiersPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/membership-tiers`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "manage_tiers")) {
		return (
			<ErrorState
				title="You don't have permission to manage membership tiers"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;

	const [tiers, stats, membershipOptions] = await Promise.all([
		serverTrpcAuthed.membershipTier.adminList.query({
			organizationSlug: orgSlug,
			search: query.search,
			status: query.status as "active" | "inactive" | "archived" | undefined,
			membershipId: query.membershipId,
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.membershipTier.adminStats.query({
			organizationSlug: orgSlug,
		}),
		serverTrpcAuthed.membershipTier.adminMembershipOptions.query({
			organizationSlug: orgSlug,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(tiers.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Membership tiers"
				description="Manage pricing tiers across all of your memberships."
				actions={
					<Button
						render={
							<Link href={`/org/${orgSlug}/membership-tiers/new` as Route} />
						}
					>
						<PlusIcon />
						New tier
					</Button>
				}
			/>

			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard label="Active" value={stats.active} />
				<StatCard label="Inactive" value={stats.inactive} />
				<StatCard label="Archived" value={stats.archived} />
			</div>

			<TierFilters membershipOptions={membershipOptions} />

			<DataTable
				title="All tiers"
				description={`Showing ${tiers.items.length} of ${tiers.total} tiers`}
				columns={[
					{
						id: "name",
						header: "Tier",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">{row.name}</div>
								<div className="text-muted-foreground text-xs">
									{row.membershipName}
								</div>
							</div>
						),
					},
					{
						id: "price",
						header: "Price",
						cell: (row) =>
							row.billingInterval === "free"
								? "Free"
								: `${row.currency} ${row.price} / ${row.billingInterval.replace("_", " ")}`,
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
						id: "maxMembers",
						header: "Max members",
						cell: (row) => row.maxMembers ?? "Unlimited",
					},
				]}
				rows={tiers.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<TierRowActions
						orgSlug={orgSlug}
						tierId={row.id}
						status={row.status}
					/>
				)}
				emptyTitle="No tiers yet"
				emptyDescription="Create a membership first, then add tiers to it."
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
