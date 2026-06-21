"use client";

import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function DefaultLink({
	item,
	children,
}: {
	item: NavigationItem;
	children: React.ReactNode;
}) {
	return <a href={item.href}>{children}</a>;
}

function AppSidebar({
	className,
	title,
	subtitle,
	items,
	footer,
	renderLink,
}: React.ComponentProps<"aside"> & {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	items: NavigationItem[];
	footer?: React.ReactNode;
	renderLink?: (
		item: NavigationItem,
		children: React.ReactNode,
	) => React.ReactNode;
}) {
	const linkRenderer =
		renderLink ??
		((item, children) => <DefaultLink item={item}>{children}</DefaultLink>);

	return (
		<aside
			className={cn(
				"hidden w-72 shrink-0 flex-col justify-between rounded-[calc(var(--radius)*1.25)] border border-sidebar-border bg-sidebar p-5 text-sidebar-foreground shadow-[var(--shadow-card)] lg:flex",
				className,
			)}
		>
			<div className="space-y-6">
				<div className="space-y-1 border-sidebar-border border-b pb-5">
					<div className="font-semibold text-[0.68rem] text-sidebar-primary uppercase tracking-[0.26em]">
						Workspace
					</div>
					<div className="font-(family-name:--font-display) text-3xl leading-none">
						{title}
					</div>
					{subtitle ? (
						<p className="text-sidebar-foreground/72 text-sm leading-6">
							{subtitle}
						</p>
					) : null}
				</div>
				<nav className="space-y-2">
					{items.map((item) => {
						const content = (
							<span
								className={cn(
									"flex items-center justify-between gap-3 rounded-[calc(var(--radius)*0.9)] border border-transparent px-3 py-3 text-sm transition-colors",
									item.disabled
										? "cursor-not-allowed opacity-45"
										: item.active
											? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
											: "hover:border-sidebar-border/80 hover:bg-sidebar-accent/60",
								)}
							>
								<span className="flex min-w-0 items-center gap-3">
									{item.icon ? (
										<span className="text-sidebar-primary">{item.icon}</span>
									) : null}
									<span className="min-w-0">
										<span className="block truncate font-medium">
											{item.label}
										</span>
										{item.description ? (
											<span className="block truncate text-sidebar-foreground/65 text-xs">
												{item.description}
											</span>
										) : null}
									</span>
								</span>
								{item.badge !== undefined ? (
									<StatusBadge
										label={String(item.badge)}
										tone={item.active ? "active" : "muted"}
									/>
								) : null}
							</span>
						);

						return (
							<div key={item.href}>
								{item.disabled ? (
									<div>{content}</div>
								) : (
									linkRenderer(item, content)
								)}
							</div>
						);
					})}
				</nav>
			</div>
			{footer ? (
				<div className="border-sidebar-border border-t pt-4">{footer}</div>
			) : null}
		</aside>
	);
}

export { AppSidebar };
