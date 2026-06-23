import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireOrganizationSession } from "@/lib/server-auth";

import { InviteAdminForm } from "./_components/invite-admin-form";

type InviteAdminPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function InviteAdminPage({
	params,
}: InviteAdminPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/admins/invite`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "invite_admins")) {
		return (
			<ErrorState
				title="You don't have permission to invite admins"
				description="Ask an organization owner to grant you the admin role."
			/>
		);
	}

	return (
		<FormSection
			title="Invite admin"
			description="The person must already have an account on the platform."
		>
			<InviteAdminForm
				orgSlug={orgSlug}
				canAssignOwner={organizationAccess.role === "owner"}
			/>
		</FormSection>
	);
}
