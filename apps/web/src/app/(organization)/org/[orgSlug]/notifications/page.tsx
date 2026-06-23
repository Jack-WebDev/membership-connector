import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";

import { NotificationList } from "@/components/notifications/notification-list";
import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

export default async function OrganizationNotificationsPage({
	params,
}: {
	params: Promise<{ orgSlug: string }>;
}) {
	const { orgSlug } = await params;
	await requireOrganizationSession(orgSlug, `/org/${orgSlug}/notifications`);

	const notifications = await serverTrpcAuthed.notification.listMine.query({
		limit: 100,
	});

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Notifications"
				description="Updates about applications, members, finances, and announcements for your organization."
			/>
			<NotificationList notifications={notifications} />
		</div>
	);
}
