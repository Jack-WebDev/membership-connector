import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { AnnouncementForm } from "../../_components/announcement-form";

type EditAnnouncementPageProps = {
	params: Promise<{ orgSlug: string; announcementId: string }>;
};

export default async function EditAnnouncementPage({
	params,
}: EditAnnouncementPageProps) {
	const { orgSlug, announcementId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/announcements/${announcementId}/edit`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "manage_announcements")
	) {
		return (
			<ErrorState
				title="You don't have permission to manage announcements"
				description="Ask an organization owner or admin to grant you the content manager role."
			/>
		);
	}

	const [announcement, filterOptions] = await Promise.all([
		serverTrpcAuthed.announcement.adminGet
			.query({ organizationSlug: orgSlug, announcementId })
			.catch((error) => {
				if (
					error instanceof TRPCClientError &&
					error.data?.code === "NOT_FOUND"
				) {
					return null;
				}
				throw error;
			}),
		serverTrpcAuthed.announcement.adminFilterOptions.query({
			organizationSlug: orgSlug,
		}),
	]);

	if (!announcement) {
		notFound();
	}

	if (announcement.status !== "draft") {
		return (
			<ErrorState
				title="Only draft announcements can be edited"
				description="Archive a published announcement and create a new draft if you need to make changes."
			/>
		);
	}

	return (
		<FormSection
			title={`Edit ${announcement.title}`}
			description="Changes apply immediately while this announcement is still a draft."
		>
			<AnnouncementForm
				orgSlug={orgSlug}
				mode="edit"
				announcementId={announcement.id}
				memberships={filterOptions.memberships}
				defaultValues={{
					membershipId: announcement.membershipId,
					title: announcement.title,
					body: announcement.body,
					visibility: announcement.visibility,
					targetMembershipTierId: announcement.targetMembershipTierId ?? "",
				}}
			/>
		</FormSection>
	);
}
