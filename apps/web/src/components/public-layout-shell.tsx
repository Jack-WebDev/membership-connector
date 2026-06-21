"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { MobileNav } from "@membership-connector-app/ui/components/mobile-nav";
import { cn } from "@membership-connector-app/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { renderNavigationLink } from "./link-renderer";
import { publicNavItems, withActiveItems } from "./nav-items";

export default function PublicLayoutShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const navItems = withActiveItems(publicNavItems, pathname);

	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-30 border-border/70 border-b bg-background/80 backdrop-blur-xl">
				<div className="mx-auto flex max-w-380 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-3">
						<MobileNav
							title="Membership Connector"
							items={navItems}
							renderLink={renderNavigationLink}
						/>
						<Link href="/" className="flex items-center gap-3">
							<span className="font-(family-name:--font-display) inline-flex size-11 items-center justify-center rounded-full border border-border/80 bg-card text-primary text-xl shadow-[var(--shadow-card)]">
								MC
							</span>
							<span>
								<span className="font-(family-name:--font-display) block text-2xl text-foreground leading-none">
									Membership Connector
								</span>
							</span>
						</Link>
					</div>
					<nav className="hidden items-center gap-2 lg:flex">
						{navItems.slice(0, 3).map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"rounded-full px-4 py-2 text-sm transition-colors",
									item.active
										? "bg-card text-foreground shadow-[var(--shadow-card)]"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{item.label}
							</Link>
						))}
					</nav>
					<div className="hidden items-center gap-2 sm:flex">
						<Link href="/auth/login">
							<Button variant="ghost">Login</Button>
						</Link>
						<Link href="/auth/register">
							<Button>Get started</Button>
						</Link>
					</div>
				</div>
			</header>
			<div className="mx-auto max-w-380 px-4 py-8 sm:px-6 lg:px-8">
				{children}
			</div>
		</div>
	);
}
