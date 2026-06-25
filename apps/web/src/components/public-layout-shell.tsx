"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { MobileNav } from "@membership-connector-app/ui/components/mobile-nav";
import { cn } from "@membership-connector-app/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { renderNavigationLink } from "./link-renderer";
import { publicNavItems, withActiveItems } from "./nav-items";

export default function PublicLayoutShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const { data: session } = authClient.useSession();
	const navItems = withActiveItems(publicNavItems(!!session), pathname);

	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-30 border-white/45 border-b bg-background/62 backdrop-blur-xl">
				<div className="mx-auto flex max-w-380 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-3">
						<MobileNav
							title="Membership Connector"
							items={navItems}
							renderLink={renderNavigationLink}
						/>
						<Link href="/" className="flex items-center gap-3">
							<span className="inline-flex size-11 items-center justify-center rounded-full border border-white/65 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.92),rgb(233_242_249_/_0.86))] font-display text-primary text-xl shadow-(--shadow-card)">
								MC
							</span>
							<span>
								<span className="block font-display text-2xl text-foreground leading-none">
									Membership Connector
								</span>
							</span>
						</Link>
					</div>
					<nav className="hidden items-center gap-2 lg:flex">
						{navItems.slice(0, 3).map((item) => (
							<Link
								key={item.href}
								href={item.href as Route}
								className={cn(
									"rounded-full px-4 py-2 text-sm transition-colors",
									item.active
										? "bg-white/82 text-foreground shadow-(--shadow-card)"
										: "text-muted-foreground hover:bg-white/55 hover:text-foreground",
								)}
							>
								{item.label}
							</Link>
						))}
					</nav>
					{!session && (
						<div className="hidden items-center gap-2 sm:flex">
							<Link href="/auth/login">
								<Button variant="ghost">Login</Button>
							</Link>
							<Link href="/auth/register">
								<Button>Get started</Button>
							</Link>
						</div>
					)}
				</div>
			</header>
			<div className="mx-auto max-w-380 px-4 py-8 sm:px-6 lg:px-8">
				{children}
			</div>
		</div>
	);
}
