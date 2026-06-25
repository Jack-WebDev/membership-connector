import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/applications/application-form";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

type MemberApplyPageProps = {
	params: Promise<{ organizationSlug: string; membershipSlug: string }>;
	searchParams: Promise<{ tier?: string }>;
};

export default async function MemberApplyToMembershipPage({
	params,
	searchParams,
}: MemberApplyPageProps) {
	const { organizationSlug, membershipSlug } = await params;
	const { tier: initialTierId } = await searchParams;
	const loginRedirectTo = `/member/browse/${organizationSlug}/${membershipSlug}/apply`;

	const session = await requireMemberSession(loginRedirectTo);

	const membership = await serverTrpcAuthed.membership.getPublicBySlug
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

	const [draft, profile] = await Promise.all([
		serverTrpcAuthed.membershipApplication.getDraftForMembership.query({
			membershipId: membership.id,
		}),
		serverTrpcAuthed.user.getMyProfile.query(),
	]);

	const profileName = `${profile.firstName} ${profile.lastName}`.trim();

	return (
		<div className="space-y-10">
			<DashboardHeader
				title={`Apply to ${membership.name}`}
				description="Tell the organization a bit about yourself. You can save your progress as a draft and come back to finish later."
			/>

			<ApplicationForm
				mode="apply"
				membershipId={membership.id}
				tiers={membership.tiers}
				applicationId={draft?.id}
				initialTierId={initialTierId}
				applicantDefaults={{
					applicantName: profileName || session.user.name,
					applicantEmail: session.user.email,
					applicantPhone: profile.phone,
				}}
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
