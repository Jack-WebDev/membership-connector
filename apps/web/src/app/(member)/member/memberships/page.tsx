import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import type { Route } from "next";
import Link from "next/link";

import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

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

export default async function MemberMembershipsPage() {
	await requireMemberSession("/member/memberships");

	const memberships = await serverTrpcAuthed.membershipMember.listMine.query();

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Memberships"
				description="Your active and past memberships across every organization you've joined."
			/>

			<DataTable
				title="All memberships"
				description={`Showing ${memberships.length} membership${memberships.length === 1 ? "" : "s"}`}
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
						header: "Started",
						cell: (row) => new Date(row.startedAt).toLocaleDateString(),
					},
					{
						id: "expiry",
						header: "Expiry",
						cell: (row) =>
							row.expiresAt
								? new Date(row.expiresAt).toLocaleDateString()
								: "—",
					},
				]}
				rows={memberships}
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
			/>
		</div>
	);
}
