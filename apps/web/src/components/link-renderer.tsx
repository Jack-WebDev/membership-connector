import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import Link from "next/link";
import type { ReactNode } from "react";

export function renderNavigationLink(
	item: NavigationItem,
	children: ReactNode,
) {
	return <Link href={item.href}>{children}</Link>;
}
