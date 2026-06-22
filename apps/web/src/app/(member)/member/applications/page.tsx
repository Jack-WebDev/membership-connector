import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import type { Route } from "next";
import Link from "next/link";

import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

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

export default async function MemberApplicationsPage() {
	await requireMemberSession("/member/applications");

	const applications =
		await serverTrpcAuthed.membershipApplication.listMine.query();

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Applications"
				description="Track the memberships you've applied to and pick up any drafts you haven't finished yet."
			/>

			<DataTable
				title="All applications"
				description={`Showing ${applications.length} application${applications.length === 1 ? "" : "s"}`}
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
						header: "Submitted",
						cell: (row) =>
							row.submittedAt
								? new Date(row.submittedAt).toLocaleDateString()
								: "—",
					},
					{
						id: "updated",
						header: "Updated",
						cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
					},
				]}
				rows={applications}
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
			/>
		</div>
	);
}
