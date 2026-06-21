"use client";

import { NavMenu } from "@membership-connector-app/ui/components/nav-menu";
import { NotificationBell } from "@membership-connector-app/ui/components/notification-bell";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@membership-connector-app/ui/components/sidebar";
import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import { ArrowLeftIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { renderNavigationLink } from "./link-renderer";
import { withActiveItems } from "./nav-items";
import UserMenu from "./user-menu";

const marketplaceItem: NavigationItem[] = [
	{
		label: "Marketplace",
		href: "/",
		icon: <ArrowLeftIcon className="size-4" />,
	},
];

export default function AppShell({
	title,
	subtitle,
	items,
	defaultOpen,
	children,
}: {
	title: string;
	subtitle?: string;
	items: NavigationItem[];
	defaultOpen: boolean;
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const activeItems = withActiveItems(items, pathname);

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<NavMenu items={marketplaceItem} renderLink={renderNavigationLink} />
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>{title}</SidebarGroupLabel>
						{subtitle ? (
							<p className="-mt-1 truncate px-2 pb-2 text-sidebar-foreground/70 text-xs group-data-[collapsible=icon]:hidden">
								{subtitle}
							</p>
						) : null}
						<SidebarGroupContent>
							<NavMenu items={activeItems} renderLink={renderNavigationLink} />
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarRail />
				<SidebarFooter>
					<UserMenu />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-border border-b bg-background/95 px-4 backdrop-blur">
					<SidebarTrigger />
					<NotificationBell
						unreadCount={3}
						items={[
							<span key="1" className="block">
								New application placeholder
							</span>,
							<span key="2" className="block">
								Announcement draft placeholder
							</span>,
						]}
					/>
				</header>
				<div className="flex-1 p-4 sm:p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
