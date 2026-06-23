import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import type { Route } from "next";
import Link from "next/link";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { AdminRowActions } from "./_components/admin-row-actions";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	active: "success",
	invited: "pending",
};

type OrganizationAdminsPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function OrganizationAdminsPage({
	params,
}: OrganizationAdminsPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/admins`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "invite_admins")) {
		return (
			<ErrorState
				title="You don't have permission to view organization admins"
				description="Ask an organization owner to grant you the admin role."
			/>
		);
	}

	const admins = await serverTrpcAuthed.organizationAdmin.list.query({
		organizationSlug: orgSlug,
	});

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Admins"
				description="Manage who has administrative access to this organization."
				actions={
					<Button
						render={<Link href={`/org/${orgSlug}/admins/invite` as Route} />}
					>
						Invite admin
					</Button>
				}
			/>

			<DataTable
				title="All admins"
				description={`Showing ${admins.length} admin${admins.length === 1 ? "" : "s"}`}
				columns={[
					{
						id: "name",
						header: "Name",
						cell: (row) => (
							<span className="font-medium text-foreground">
								{row.userName}
							</span>
						),
					},
					{
						id: "email",
						header: "Email",
						cell: (row) => (
							<span className="text-muted-foreground text-sm">
								{row.userEmail}
							</span>
						),
					},
					{
						id: "role",
						header: "Role",
						cell: (row) => (
							<span className="capitalize">{row.role.replace(/_/g, " ")}</span>
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
						id: "invited",
						header: "Invited date",
						cell: (row) => new Date(row.invitedAt).toLocaleDateString(),
					},
				]}
				rows={admins}
				rowKey={(row) => row.id}
				actions={(row) => (
					<AdminRowActions
						orgSlug={orgSlug}
						adminId={row.id}
						userName={row.userName}
						role={row.role}
						status={row.status}
						viewerRole={organizationAccess.role}
					/>
				)}
				emptyTitle="No admins yet"
				emptyDescription="Invite an admin to help manage this organization."
			/>
		</div>
	);
}
