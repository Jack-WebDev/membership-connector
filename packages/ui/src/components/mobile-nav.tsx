/** biome-ignore-all lint/a11y/noStaticElementInteractions: biome-ignore lint: false positive */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: biome-ignore lint: false positive */
"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./sheet";

function DefaultLink({
	item,
	children,
}: {
	item: NavigationItem;
	children: React.ReactNode;
}) {
	return <a href={item.href}>{children}</a>;
}

function MobileNav({
	title,
	items,
	renderLink,
	footer,
}: {
	title: string;
	items: NavigationItem[];
	renderLink?: (
		item: NavigationItem,
		children: React.ReactNode,
	) => React.ReactNode;
	footer?: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const linkRenderer =
		renderLink ??
		((item, children) => <DefaultLink item={item}>{children}</DefaultLink>);

	return (
		<div className="lg:hidden">
			<Button variant="outline" size="icon" onClick={() => setOpen(true)}>
				<MenuIcon />
				<span className="sr-only">Open navigation</span>
			</Button>
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="left"
					className="w-[22rem] max-w-[92vw] bg-card p-0"
				>
					<SheetHeader className="border-border/80 border-b p-6 text-left">
						<SheetTitle className="font-(family-name:--font-display) text-3xl">
							{title}
						</SheetTitle>
						<SheetDescription>
							Navigate the workspace sections.
						</SheetDescription>
					</SheetHeader>
					<div className="flex h-full flex-col justify-between gap-6 p-5">
						<nav className="space-y-2">
							{items.map((item) => {
								const content = (
									<span
										className={cn(
											"flex items-center gap-3 rounded-[calc(var(--radius)*0.9)] border px-3 py-3 text-sm",
											item.active
												? "border-border bg-muted text-foreground"
												: "border-transparent bg-transparent text-muted-foreground",
											!item.disabled &&
												"hover:border-border hover:bg-muted/70 hover:text-foreground",
											item.disabled && "opacity-45",
										)}
									>
										{item.icon ? (
											<span className="text-primary">{item.icon}</span>
										) : null}
										<span>{item.label}</span>
									</span>
								);

								return (
									<div
										key={item.href}
										onClick={() => !item.disabled && setOpen(false)}
									>
										{item.disabled ? (
											<div>{content}</div>
										) : (
											linkRenderer(item, content)
										)}
									</div>
								);
							})}
						</nav>
						{footer ? (
							<div className="border-border/80 border-t pt-4">{footer}</div>
						) : null}
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}

export { MobileNav };
