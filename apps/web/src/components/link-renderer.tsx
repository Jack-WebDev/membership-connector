import type { NavigationItem } from "@membership-connector-app/ui/lib/app-types";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export function renderNavigationLink(
	item: NavigationItem,
	children: ReactNode,
) {
	return <Link href={item.href as Route}>{children}</Link>;
}
