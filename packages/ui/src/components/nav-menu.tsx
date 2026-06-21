import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import type * as React from "react";
import {
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./sidebar";

function NavMenu({
	items,
	renderLink,
}: {
	items: NavigationItem[];
	renderLink: (
		item: NavigationItem,
		children: React.ReactNode,
	) => React.ReactNode;
}) {
	return (
		<SidebarMenu>
			{items.map((item) => {
				const content = (
					<>
						{item.icon}
						<span className="truncate">{item.label}</span>
					</>
				);

				return (
					<SidebarMenuItem key={item.href}>
						<SidebarMenuButton
							isActive={item.active}
							disabled={item.disabled}
							tooltip={item.label}
							render={
								item.disabled
									? undefined
									: (renderLink(item, content) as React.ReactElement)
							}
						>
							{item.disabled ? content : null}
						</SidebarMenuButton>
						{item.badge !== undefined ? (
							<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
						) : null}
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}

export { NavMenu };
