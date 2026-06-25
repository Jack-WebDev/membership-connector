import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { TRPCClientError } from "@trpc/client";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/applications/application-form";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { WithdrawApplicationButton } from "./_components/withdraw-application-button";

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

const WITHDRAWABLE_STATUSES = [
	"submitted",
	"under_review",
	"needs_information",
];

type ApplicationDetailPageProps = {
	params: Promise<{ applicationId: string }>;
};

export default async function MemberApplicationDetailPage({
	params,
}: ApplicationDetailPageProps) {
	const { applicationId } = await params;

	await requireMemberSession(`/member/applications/${applicationId}`);

	const application = await serverTrpcAuthed.membershipApplication.getMine
		.query({ applicationId })
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
				title={application.membershipName}
				description={application.organizationName}
				status={{
					label: application.status.replace("_", " "),
					tone: STATUS_TONES[application.status] ?? "muted",
				}}
				actions={
					<>
						{application.status === "draft" ? (
							<Button
								render={
									<Link
										href={
											`/member/browse/${application.organizationSlug}/${application.membershipSlug}/apply` as Route
										}
									/>
								}
							>
								Continue application
							</Button>
						) : null}
						{WITHDRAWABLE_STATUSES.includes(application.status) ? (
							<WithdrawApplicationButton applicationId={application.id} />
						) : null}
					</>
				}
			/>

			<FormSection
				title="Application details"
				description={application.tierName}
			>
				<dl className="grid gap-4 sm:grid-cols-2">
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
							Last reviewed
						</dt>
						<dd className="text-sm">
							{application.reviewedAt
								? new Date(application.reviewedAt).toLocaleString()
								: "—"}
						</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Applicant
						</dt>
						<dd className="text-sm">
							{String(answers.applicantName ?? "—")} ·{" "}
							{String(answers.applicantEmail ?? "—")}
						</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Reason for applying
						</dt>
						<dd className="text-sm leading-6">
							{String(answers.reason ?? "—")}
						</dd>
					</div>
				</dl>
				{application.reviewNotes ? (
					<div className="space-y-1 rounded-md border border-border/70 bg-muted/40 p-4">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							Notes from the organization
						</div>
						<p className="text-sm leading-6">{application.reviewNotes}</p>
					</div>
				) : null}
			</FormSection>

			{application.status === "needs_information" ? (
				<FormSection
					title="More information requested"
					description="Update your answers below and resubmit your application."
				>
					<ApplicationForm
						mode="respond"
						membershipId={application.membershipId}
						tiers={[]}
						applicationId={application.id}
						defaultValues={{
							membershipTierId: application.membershipTierId,
							applicantName: String(answers.applicantName ?? ""),
							applicantEmail: String(answers.applicantEmail ?? ""),
							applicantPhone: String(answers.applicantPhone ?? ""),
							reason: String(answers.reason ?? ""),
							background: String(answers.background ?? ""),
							notes: String(answers.notes ?? ""),
							agreement: Boolean(answers.agreement ?? false),
						}}
					/>
				</FormSection>
			) : null}
		</div>
	);
}
