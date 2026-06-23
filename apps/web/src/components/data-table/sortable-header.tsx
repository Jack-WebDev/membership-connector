import { cn } from "@membership-connector-app/ui/lib/utils";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type SortableHeaderProps = {
	label: string;
	href: Route;
	active: boolean;
	direction: "asc" | "desc";
};

function SortableHeader({
	label,
	href,
	active,
	direction,
}: SortableHeaderProps) {
	const Icon = active
		? direction === "asc"
			? ArrowUpIcon
			: ArrowDownIcon
		: ArrowUpDownIcon;

	return (
		<Link
			href={href}
			className={cn(
				"inline-flex items-center gap-1.5 hover:text-foreground",
				active ? "text-foreground" : "text-muted-foreground",
			)}
		>
			{label}
			<Icon className="size-3.5" />
		</Link>
	);
}

export { SortableHeader };
