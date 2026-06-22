import { PageHeader } from "@membership-connector-app/ui/components/page-header";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/applications/application-form";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpc, serverTrpcAuthed } from "@/utils/trpc-server";

type ApplyPageProps = {
	params: Promise<{ organizationSlug: string; membershipSlug: string }>;
};

export default async function ApplyToMembershipPage({
	params,
}: ApplyPageProps) {
	const { organizationSlug, membershipSlug } = await params;
	const loginRedirectTo = `/organizations/${organizationSlug}/memberships/${membershipSlug}/apply`;

	await requireMemberSession(loginRedirectTo);

	const membership = await serverTrpc.membership.getPublicBySlug
		.query({ organizationSlug, membershipSlug })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}

			throw error;
		});

	if (!membership) {
		notFound();
	}

	const draft =
		await serverTrpcAuthed.membershipApplication.getDraftForMembership.query({
			membershipId: membership.id,
		});

	return (
		<div className="space-y-10">
			<PageHeader
				eyebrow={membership.organizationName}
				title={`Apply to ${membership.name}`}
				description="Tell the organization a bit about yourself. You can save your progress as a draft and come back to finish later."
			/>

			<ApplicationForm
				mode="apply"
				membershipId={membership.id}
				tiers={membership.tiers}
				applicationId={draft?.id}
				defaultValues={
					draft
						? {
								membershipTierId: draft.membershipTierId,
								applicantName: String(draft.answers.applicantName ?? ""),
								applicantEmail: String(draft.answers.applicantEmail ?? ""),
								applicantPhone: String(draft.answers.applicantPhone ?? ""),
								reason: String(draft.answers.reason ?? ""),
								background: String(draft.answers.background ?? ""),
								notes: String(draft.answers.notes ?? ""),
								agreement: Boolean(draft.answers.agreement ?? false),
							}
						: undefined
				}
			/>
		</div>
	);
}
