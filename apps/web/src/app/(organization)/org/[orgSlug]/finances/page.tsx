import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
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
import {
	BanknoteIcon,
	ClockIcon,
	TrendingUpIcon,
	XCircleIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { FinanceFilters } from "./_components/finance-filters";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	pending: "pending",
	successful: "success",
	failed: "danger",
	refunded: "muted",
	cancelled: "muted",
};

const PAGE_SIZE = 20;

type OrganizationFinancesPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{
		search?: string;
		status?: string;
		type?: string;
		provider?: string;
		membershipId?: string;
		membershipTierId?: string;
		dateFrom?: string;
		dateTo?: string;
		page?: string;
	}>;
};

export default async function OrganizationFinancesPage({
	params,
	searchParams,
}: OrganizationFinancesPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/finances`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "view_finances")) {
		return (
			<ErrorState
				title="You don't have permission to view finances"
				description="Ask an organization owner or admin to grant you the finance manager role."
			/>
		);
	}

	const canManageFinances = hasOrganizationPermission(
		organizationAccess.role,
		"manage_finance_records",
	);

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;

	const [overview, transactions, filterOptions] = await Promise.all([
		serverTrpcAuthed.finance.adminDashboard.query({
			organizationSlug: orgSlug,
		}),
		serverTrpcAuthed.finance.adminList.query({
			organizationSlug: orgSlug,
			search: query.search,
			status: query.status as
				| "pending"
				| "successful"
				| "failed"
				| "refunded"
				| "cancelled"
				| undefined,
			type: query.type as
				| "membership_payment"
				| "refund"
				| "adjustment"
				| "payout"
				| "fee"
				| undefined,
			provider: query.provider as
				| "manual"
				| "cash"
				| "eft"
				| "demo"
				| undefined,
			membershipId: query.membershipId,
			membershipTierId: query.membershipTierId,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.finance.adminFilterOptions.query({
			organizationSlug: orgSlug,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(transactions.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.type) params.set("type", query.type);
		if (query.provider) params.set("provider", query.provider);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		if (query.membershipTierId)
			params.set("membershipTierId", query.membershipTierId);
		if (query.dateFrom) params.set("dateFrom", query.dateFrom);
		if (query.dateTo) params.set("dateTo", query.dateTo);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Finances"
				description="Demo finance records and revenue summaries for your organization."
				actions={
					canManageFinances ? (
						<Button
							render={<Link href={`/org/${orgSlug}/finances/new` as Route} />}
						>
							Record transaction
						</Button>
					) : undefined
				}
			/>

			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
				<StatCard
					label="Total demo revenue"
					value={`${overview.currency} ${overview.totalRevenue}`}
					icon={<BanknoteIcon />}
				/>
				<StatCard
					label="Monthly demo revenue"
					value={`${overview.currency} ${overview.monthlyRevenue}`}
					icon={<TrendingUpIcon />}
				/>
				<StatCard
					label="Pending amount"
					value={`${overview.currency} ${overview.pendingAmount}`}
					icon={<ClockIcon />}
				/>
				<StatCard
					label="Failed amount"
					value={`${overview.currency} ${overview.failedAmount}`}
					icon={<XCircleIcon />}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<section className="space-y-3">
					<h2 className="font-(family-name:--font-display) text-foreground text-xl">
						Revenue by membership
					</h2>
					{overview.revenueByMembership.length > 0 ? (
						<ul className="space-y-2">
							{overview.revenueByMembership.map((row) => (
								<li
									key={row.id}
									className="flex items-center justify-between rounded-[calc(var(--radius)*1.1)] border border-border/80 bg-card/90 p-4 text-sm shadow-[var(--shadow-card)]"
								>
									<span className="text-foreground">{row.name}</span>
									<span className="text-muted-foreground">
										{overview.currency} {row.amount}
									</span>
								</li>
							))}
						</ul>
					) : (
						<EmptyState
							title="No revenue yet"
							description="Successful membership payments will be grouped here by membership."
						/>
					)}
				</section>
				<section className="space-y-3">
					<h2 className="font-(family-name:--font-display) text-foreground text-xl">
						Revenue by tier
					</h2>
					{overview.revenueByTier.length > 0 ? (
						<ul className="space-y-2">
							{overview.revenueByTier.map((row) => (
								<li
									key={row.id}
									className="flex items-center justify-between rounded-[calc(var(--radius)*1.1)] border border-border/80 bg-card/90 p-4 text-sm shadow-[var(--shadow-card)]"
								>
									<span className="text-foreground">{row.name}</span>
									<span className="text-muted-foreground">
										{overview.currency} {row.amount}
									</span>
								</li>
							))}
						</ul>
					) : (
						<EmptyState
							title="No revenue yet"
							description="Successful membership payments will be grouped here by tier."
						/>
					)}
				</section>
			</div>

			<FinanceFilters
				memberships={filterOptions.memberships}
				tiers={filterOptions.tiers}
			/>

			<DataTable
				title="All transactions"
				description={`Showing ${transactions.items.length} of ${transactions.total} transactions`}
				columns={[
					{
						id: "date",
						header: "Date",
						cell: (row) => new Date(row.createdAt).toLocaleDateString(),
					},
					{
						id: "member",
						header: "Member",
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">
									{row.userName ?? "—"}
								</div>
								<div className="text-muted-foreground text-xs">
									{row.userEmail ?? ""}
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
									{row.membershipName ?? "—"}
								</div>
								<div className="text-muted-foreground text-xs">
									{row.tierName ?? ""}
								</div>
							</div>
						),
					},
					{
						id: "amount",
						header: "Amount",
						cell: (row) => `${row.currency} ${row.amount}`,
					},
					{
						id: "type",
						header: "Type",
						cell: (row) => row.type.replace("_", " "),
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
						id: "provider",
						header: "Provider",
						cell: (row) => row.provider,
					},
				]}
				rows={transactions.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<Button
						size="sm"
						variant="outline"
						render={
							<Link href={`/org/${orgSlug}/finances/${row.id}` as Route} />
						}
					>
						View
					</Button>
				)}
				emptyTitle="No transactions yet"
				emptyDescription="Demo finance transactions you record will appear here."
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
