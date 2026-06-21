"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@membership-connector-app/ui/components/dropdown-menu";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { BellIcon } from "lucide-react";
import type * as React from "react";

function NotificationBell({
	className,
	unreadCount = 0,
	items = [],
	emptyLabel = "No notifications yet",
}: {
	className?: string;
	unreadCount?: number;
	items?: React.ReactNode[];
	emptyLabel?: string;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size="icon"
						className={cn("relative", className)}
					/>
				}
			>
				<BellIcon />
				{unreadCount > 0 ? (
					<span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 font-semibold text-[0.62rem] text-primary-foreground">
						{unreadCount}
					</span>
				) : null}
				<span className="sr-only">Notifications</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-80">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Notifications</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{items.length ? (
						items.map((item, index) => (
							<DropdownMenuItem key={index}>{item}</DropdownMenuItem>
						))
					) : (
						<DropdownMenuItem disabled>{emptyLabel}</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { NotificationBell };
