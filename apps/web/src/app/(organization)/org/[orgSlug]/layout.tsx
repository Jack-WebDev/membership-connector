import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { organizationNavItems } from "@/components/nav-items";
import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

export default async function OrganizationLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ orgSlug: string }>;
}) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/dashboard`,
	);
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	const [unreadCount, recentNotifications] = await Promise.all([
		serverTrpcAuthed.notification.unreadCount.query(),
		serverTrpcAuthed.notification.listMine.query({ pageSize: 5 }),
	]);

	return (
		<AppShell
			title={organizationAccess.name}
			subtitle={organizationAccess.role}
			items={organizationNavItems(
				orgSlug,
				organizationAccess.role,
				unreadCount,
			)}
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
