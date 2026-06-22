import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { ApplicationReviewActions } from "./_components/application-review-actions";
import { PaymentReceivedButton } from "./_components/payment-received-button";

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

type OrganizationApplicationDetailPageProps = {
	params: Promise<{ orgSlug: string; applicationId: string }>;
};

export default async function OrganizationApplicationDetailPage({
	params,
}: OrganizationApplicationDetailPageProps) {
	const { orgSlug, applicationId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/applications/${applicationId}`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "view_applications")
	) {
		return (
			<ErrorState
				title="You don't have permission to view this application"
				description="Ask an organization owner or admin to grant you the reviewer role."
			/>
		);
	}

	const application = await serverTrpcAuthed.membershipApplication.adminGet
		.query({ organizationSlug: orgSlug, applicationId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}

			throw error;
		});

	if (!application) {
		notFound();
	}

	const answers = application.answers as Record<string, unknown>;

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={String(
					answers.applicantName ?? application.applicantName ?? "—",
				)}
				description={`${application.membershipName} · ${application.tierName}`}
				status={{
					label: application.status.replace("_", " "),
					tone: STATUS_TONES[application.status] ?? "muted",
				}}
				actions={
					<ApplicationReviewActions
						orgSlug={orgSlug}
						applicationId={application.id}
						status={application.status}
					/>
				}
			/>

			<FormSection title="Applicant">
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Name
						</dt>
						<dd className="text-sm">{String(answers.applicantName ?? "—")}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Email
						</dt>
						<dd className="text-sm">{String(answers.applicantEmail ?? "—")}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Phone
						</dt>
						<dd className="text-sm">{String(answers.applicantPhone ?? "—")}</dd>
					</div>
				</dl>
			</FormSection>

			<FormSection title="Application" description={application.tierName}>
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Membership
						</dt>
						<dd className="text-sm">{application.membershipName}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Tier
						</dt>
						<dd className="text-sm">{application.tierName}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Submitted
						</dt>
						<dd className="text-sm">
							{application.submittedAt
								? new Date(application.submittedAt).toLocaleString()
								: "Not submitted yet"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Last updated
						</dt>
						<dd className="text-sm">
							{new Date(application.updatedAt).toLocaleString()}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Last reviewed
						</dt>
						<dd className="text-sm">
							{application.reviewedAt
								? new Date(application.reviewedAt).toLocaleString()
								: "—"}
						</dd>
					</div>
				</dl>
			</FormSection>

			<FormSection title="Answers">
				<dl className="grid gap-4">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Reason for applying
						</dt>
						<dd className="text-sm leading-6">
							{String(answers.reason ?? "—")}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Background
						</dt>
						<dd className="text-sm leading-6">
							{String(answers.background ?? "—")}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Notes
						</dt>
						<dd className="text-sm leading-6">
							{String(answers.notes ?? "—")}
						</dd>
					</div>
				</dl>
				{application.reviewNotes ? (
					<div className="space-y-1 rounded-md border border-border/70 bg-muted/40 p-4">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Review notes
						</div>
						<p className="text-sm leading-6">{application.reviewNotes}</p>
					</div>
				) : null}
			</FormSection>

			{application.status === "approved" &&
			application.member?.status === "pending_payment" ? (
				<FormSection
					title="Awaiting payment"
					description="This applicant has been approved but their membership won't activate until payment is confirmed."
				>
					<PaymentReceivedButton
						orgSlug={orgSlug}
						applicationId={application.id}
					/>
				</FormSection>
			) : null}
		</div>
	);
}
