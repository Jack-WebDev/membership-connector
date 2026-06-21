import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { MembershipForm } from "../../_components/membership-form";

type EditMembershipPageProps = {
	params: Promise<{ orgSlug: string; membershipId: string }>;
};

export default async function EditMembershipPage({
	params,
}: EditMembershipPageProps) {
	const { orgSlug, membershipId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/memberships/${membershipId}/edit`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "manage_memberships")
	) {
		return (
			<ErrorState
				title="You don't have permission to manage memberships"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const membership = await serverTrpcAuthed.membership.adminGet
		.query({ organizationSlug: orgSlug, membershipId })
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

	return (
		<FormSection
			title={`Edit ${membership.name}`}
			description="Changes apply immediately. Status is managed separately from the membership detail page."
		>
			<MembershipForm
				orgSlug={orgSlug}
				mode="edit"
				membershipId={membership.id}
				defaultValues={{
					name: membership.name,
					slug: membership.slug,
					category: membership.category ?? "",
					shortDescription: membership.shortDescription ?? "",
					description: membership.description ?? "",
					visibility: membership.visibility,
					applicationRequired: membership.applicationRequired,
					publicAnnouncementsEnabled: membership.publicAnnouncementsEnabled,
					membersOnlyContentEnabled: membership.membersOnlyContentEnabled,
				}}
			/>
		</FormSection>
	);
}
