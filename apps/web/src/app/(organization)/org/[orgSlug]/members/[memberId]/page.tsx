import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { ChangeTierDialog } from "./_components/change-tier-dialog";
import { MemberNotesForm } from "./_components/member-notes-form";
import { MemberStatusActions } from "./_components/member-status-actions";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	active: "success",
	pending_payment: "pending",
	suspended: "warning",
	expired: "muted",
	cancelled: "danger",
};

const APPLICATION_STATUS_TONES: Record<string, StatusBadgeTone> = {
	draft: "draft",
	submitted: "pending",
	under_review: "info",
	needs_information: "warning",
	approved: "success",
	rejected: "danger",
	withdrawn: "muted",
	cancelled: "muted",
};

type OrganizationMemberDetailPageProps = {
	params: Promise<{ orgSlug: string; memberId: string }>;
};

export default async function OrganizationMemberDetailPage({
	params,
}: OrganizationMemberDetailPageProps) {
	const { orgSlug, memberId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/members/${memberId}`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "manage_members")) {
		return (
			<ErrorState
				title="You don't have permission to view this member"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const member = await serverTrpcAuthed.membershipMember.adminGet
		.query({ organizationSlug: orgSlug, memberId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}

			throw error;
		});

	if (!member) {
		notFound();
	}

	const availableTiers = await serverTrpcAuthed.membershipTier.adminList.query({
		organizationSlug: orgSlug,
		membershipId: member.membershipId,
		status: "active",
		pageSize: 100,
	});

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={member.userName}
				description={`${member.membershipName} · ${member.tierName}`}
				status={{
					label: member.status.replace("_", " "),
					tone: STATUS_TONES[member.status] ?? "muted",
				}}
				actions={
					<MemberStatusActions
						orgSlug={orgSlug}
						memberId={member.id}
						status={member.status}
					/>
				}
			/>

			<FormSection title="Profile">
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Name
						</dt>
						<dd className="text-sm">{member.userName}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Email
						</dt>
						<dd className="text-sm">{member.userEmail}</dd>
					</div>
				</dl>
			</FormSection>

			<FormSection
				title="Membership"
				description={`${member.tierCurrency} ${member.tierPrice} · ${member.tierBillingInterval.replace("_", " ")}`}
			>
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Membership
						</dt>
						<dd className="text-sm">{member.membershipName}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Tier
						</dt>
						<dd className="text-sm">{member.tierName}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Started
						</dt>
						<dd className="text-sm">
							{new Date(member.startedAt).toLocaleDateString()}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Expires
						</dt>
						<dd className="text-sm">
							{member.expiresAt
								? new Date(member.expiresAt).toLocaleDateString()
								: "—"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Payment status
						</dt>
						<dd className="text-sm capitalize">{member.paymentStatus}</dd>
					</div>
				</dl>
				{member.status === "active" || member.status === "pending_payment" ? (
					<ChangeTierDialog
						orgSlug={orgSlug}
						memberId={member.id}
						currentTierId={member.membershipTierId}
						tiers={availableTiers.items}
					/>
				) : null}
			</FormSection>

			<FormSection title="Applications">
				{member.applications.length > 0 ? (
					<ul className="space-y-2">
						{member.applications.map((application) => (
							<li
								key={application.id}
								className="flex items-center justify-between rounded-md border border-border/70 bg-muted/40 p-3 text-sm"
							>
								<StatusBadge
									label={application.status.replace("_", " ")}
									tone={APPLICATION_STATUS_TONES[application.status] ?? "muted"}
								/>
								<span className="text-muted-foreground text-xs">
									{application.submittedAt
										? new Date(application.submittedAt).toLocaleDateString()
										: "—"}
								</span>
							</li>
						))}
					</ul>
				) : (
					<EmptyState
						title="No applications"
						description="This member has no applications for this membership."
					/>
				)}
			</FormSection>

			<FormSection title="Demo finance records">
				{member.financeRecords.length > 0 ? (
					<ul className="space-y-2">
						{member.financeRecords.map((record) => (
							<li
								key={record.id}
								className="flex items-center justify-between rounded-md border border-border/70 bg-muted/40 p-3 text-sm"
							>
								<span className="capitalize">
									{record.type.replace("_", " ")}
								</span>
								<span>
									{record.currency} {record.amount}
								</span>
								<span className="text-muted-foreground text-xs capitalize">
									{record.status}
								</span>
							</li>
						))}
					</ul>
				) : (
					<EmptyState
						title="No finance records yet"
						description="Demo finance transactions for this member will appear here."
					/>
				)}
			</FormSection>

			<FormSection title="Comments and activity">
				{member.comments.length > 0 ? (
					<ul className="space-y-2">
						{member.comments.map((comment) => (
							<li
								key={comment.id}
								className="space-y-1 rounded-md border border-border/70 bg-muted/40 p-3 text-sm"
							>
								<div className="text-muted-foreground text-xs">
									{comment.announcementTitle}
								</div>
								<p>{comment.body}</p>
							</li>
						))}
					</ul>
				) : (
					<EmptyState
						title="No activity yet"
						description="Comments this member leaves on announcements will appear here."
					/>
				)}
			</FormSection>

			<FormSection
				title="Admin notes"
				description="Internal notes about this member. Not visible to the member."
			>
				<MemberNotesForm
					orgSlug={orgSlug}
					memberId={member.id}
					initialNotes={member.notes}
				/>
			</FormSection>
		</div>
	);
}
