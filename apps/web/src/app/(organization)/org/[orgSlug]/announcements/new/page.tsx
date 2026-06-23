import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { AnnouncementForm } from "../_components/announcement-form";

type NewAnnouncementPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function NewAnnouncementPage({
	params,
}: NewAnnouncementPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/announcements/new`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "post_announcements")
	) {
		return (
			<ErrorState
				title="You don't have permission to post announcements"
				description="Ask an organization owner or admin to grant you the content manager role."
			/>
		);
	}

	const filterOptions =
		await serverTrpcAuthed.announcement.adminFilterOptions.query({
			organizationSlug: orgSlug,
		});

	return (
		<FormSection
			title="New announcement"
			description="It will be created as a draft. Publish it when you're ready for members to see it."
		>
			<AnnouncementForm
				orgSlug={orgSlug}
				mode="create"
				memberships={filterOptions.memberships}
			/>
		</FormSection>
	);
}
