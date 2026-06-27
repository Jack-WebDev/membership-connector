import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { MembershipForm } from "../_components/membership-form";

type NewMembershipPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function NewMembershipPage({
	params,
}: NewMembershipPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/memberships/new`,
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

	const categoryOptions =
		await serverTrpcAuthed.membership.listCategories.query();

	return (
		<FormSection
			title="New membership"
			description="It will be created as a draft. Publish it when you're ready for it to appear publicly."
		>
			<MembershipForm
				orgSlug={orgSlug}
				mode="create"
				categoryOptions={categoryOptions}
			/>
		</FormSection>
	);
}
