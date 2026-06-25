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
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@membership-connector-app/ui/components/sidebar";
import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { renderNavigationLink } from "./link-renderer";
import { withActiveItems } from "./nav-items";
import UserMenu from "./user-menu";

export default function AppShell({
	title,
	subtitle,
	items,
	defaultOpen,
	notificationBell,
	children,
}: {
	title?: string;
	subtitle?: string;
	items: NavigationItem[];
	defaultOpen: boolean;
	notificationBell?: { unreadCount: number; items: React.ReactNode[] };
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const activeItems = withActiveItems(items, pathname);
	const currentItem = activeItems.find((item) => item.active);

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								tooltip="Membership Connector"
								className="h-auto py-3"
								render={<Link href="/" />}
							>
								<span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border/80 bg-sidebar-accent/40 font-display text-sidebar-foreground text-sm shadow-[var(--shadow-card)]">
									MC
								</span>
								<span className="min-w-0 group-data-[collapsible=icon]:hidden">
									<span className="block truncate font-display text-sidebar-foreground text-sm leading-none">
										Membership Connector
									</span>
								</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						{/* <SidebarGroupLabel>{title}</SidebarGroupLabel>
						{subtitle ? (
							<p className="-mt-1 truncate px-2 pb-2 text-sidebar-foreground/70 text-xs group-data-[collapsible=icon]:hidden">
								{subtitle}
							</p>
						) : null} */}
						<SidebarGroupContent>
							<NavMenu items={activeItems} renderLink={renderNavigationLink} />
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarRail />
				<SidebarFooter className="mb-8">
					<UserMenu />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-border border-b bg-background/95 px-4 backdrop-blur">
					<div className="flex min-w-0 items-center gap-3">
						<SidebarTrigger />
						{currentItem ? (
							<div className="min-w-0">
								<p className="truncate font-medium text-base text-foreground">
									{currentItem.label}
								</p>
							</div>
						) : null}
					</div>
					<NotificationBell
						unreadCount={notificationBell?.unreadCount ?? 0}
						items={notificationBell?.items ?? []}
					/>
				</header>
				<div className="flex-1 p-4 sm:p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
