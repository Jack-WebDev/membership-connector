import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";

import { NotificationList } from "@/components/notifications/notification-list";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

export default async function MemberNotificationsPage() {
	await requireMemberSession("/member/notifications");

	const notifications = await serverTrpcAuthed.notification.listMine.query({
		limit: 100,
	});

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Notifications"
				description="Updates about your applications, memberships, and announcements."
			/>
			<NotificationList notifications={notifications} />
		</div>
	);
}
