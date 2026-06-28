import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { platformNavItems } from "@/components/nav-items";
import { requireLulafiSubmissionInboxSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

export default async function PlatformAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireLulafiSubmissionInboxSession("/admin/submissions");
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
	const [unreadCount, recentNotifications] = await Promise.all([
		serverTrpcAuthed.notification.unreadCount.query(),
		serverTrpcAuthed.notification.listMine.query({ pageSize: 5 }),
	]);

	return (
		<AppShell
			title="LulaFi submissions"
			subtitle="shared inbox"
			items={platformNavItems()}
			defaultOpen={defaultOpen}
			notificationBell={{
				unreadCount,
				items: recentNotifications.items.map((notification) => (
					<span key={notification.id} className="block">
						<span className="block font-medium text-foreground">
							{notification.title}
						</span>
						<span className="block text-muted-foreground text-xs">
							{notification.body}
						</span>
					</span>
				)),
			}}
		>
			{children}
		</AppShell>
	);
}
