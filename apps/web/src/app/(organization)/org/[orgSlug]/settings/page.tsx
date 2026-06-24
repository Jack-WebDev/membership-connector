import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { OrganizationSettingsForm } from "./_components/organization-settings-form";

type OrganizationSettingsPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function OrganizationSettingsPage({
	params,
}: OrganizationSettingsPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/settings`,
	);

	if (
		!hasOrganizationPermission(
			organizationAccess.role,
			"update_organization_settings",
		)
	) {
		return (
			<ErrorState
				title="You don't have permission to update organization settings"
				description="Ask an organization owner or admin to make these changes."
			/>
		);
	}

	const organization = await serverTrpcAuthed.organization.adminGet.query({
		organizationSlug: orgSlug,
	});

	return (
		<FormSection
			title="Organization settings"
			description="Update your organization's public profile details."
		>
			<OrganizationSettingsForm
				orgSlug={orgSlug}
				defaultValues={{
					name: organization.name,
					description: organization.description ?? "",
					websiteUrl: organization.websiteUrl ?? "",
					email: organization.email ?? "",
					phone: organization.phone ?? "",
				}}
			/>
		</FormSection>
	);
}
