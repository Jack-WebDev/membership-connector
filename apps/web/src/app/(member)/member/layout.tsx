import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { memberNavItems } from "@/components/nav-items";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

export default async function MemberLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireMemberSession("/member/dashboard");
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	const [unreadCount, recentNotifications] = await Promise.all([
		serverTrpcAuthed.notification.unreadCount.query(),
		serverTrpcAuthed.notification.listMine.query({ pageSize: 5 }),
	]);

	return (
		<AppShell
			title="Member area"
			subtitle="Applications, memberships, and saved items"
			items={memberNavItems("/member", unreadCount)}
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
