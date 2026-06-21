"use client";

import { AppSidebar } from "@membership-connector-app/ui/components/app-sidebar";
import { MobileNav } from "@membership-connector-app/ui/components/mobile-nav";
import { NotificationBell } from "@membership-connector-app/ui/components/notification-bell";
import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { renderNavigationLink } from "./link-renderer";
import { withActiveItems } from "./nav-items";
import UserMenu from "./user-menu";

export default function DashboardLayoutShell({
	title,
	subtitle,
	items,
	children,
	topline,
}: {
	title: string;
	subtitle: string;
	items: NavigationItem[];
	children: React.ReactNode;
	topline: string;
}) {
	const pathname = usePathname();
	const activeItems = withActiveItems(items, pathname);

	return (
		<div className="min-h-screen">
			<div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
				<AppSidebar
					title={title}
					subtitle={subtitle}
					items={activeItems}
					renderLink={renderNavigationLink}
					footer={
						<div className="space-y-2 text-sidebar-foreground/72 text-sm">
							<div className="font-medium text-sidebar-foreground">
								{topline}
							</div>
							<div>
								Phase 2 scaffolding only. Later phases attach auth, permissions,
								and data.
							</div>
						</div>
					}
				/>
				<div className="min-w-0 flex-1 space-y-6">
					<header className="flex flex-wrap items-center justify-between gap-4 rounded-[calc(var(--radius)*1.15)] border border-border/80 bg-card/85 px-4 py-3 shadow-[var(--shadow-card)]">
						<div className="flex items-center gap-3">
							<MobileNav
								title={title}
								items={activeItems}
								renderLink={renderNavigationLink}
								footer={
									<div className="space-y-1 text-muted-foreground text-sm">
										<div className="font-medium text-foreground">
											{subtitle}
										</div>
										<div>{topline}</div>
									</div>
								}
							/>
							<Link
								href="/"
								className="hidden font-semibold text-[0.7rem] text-muted-foreground uppercase tracking-[0.24em] sm:block"
							>
								Back to marketplace
							</Link>
						</div>
						<div className="flex items-center gap-2">
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
							<UserMenu />
						</div>
					</header>
					{children}
				</div>
			</div>
		</div>
	);
}
