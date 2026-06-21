import { Button } from "@membership-connector-app/ui/components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@membership-connector-app/ui/components/empty";
import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function EmptyState({
	className,
	icon,
	title,
	description,
	actionLabel,
	action,
}: Omit<React.ComponentProps<"div">, "title"> & {
	icon?: React.ReactNode;
	title: React.ReactNode;
	description: React.ReactNode;
	actionLabel?: string;
	action?: React.ReactNode;
}) {
	return (
		<Empty
			className={cn(
				"rounded-[calc(var(--radius)*1.25)] border border-border border-dashed bg-card/80 py-12 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			<EmptyHeader>
				{icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
				<EmptyTitle className="font-(family-name:--font-display) text-2xl">
					{title}
				</EmptyTitle>
				<EmptyDescription className="max-w-md text-sm leading-7">
					{description}
				</EmptyDescription>
			</EmptyHeader>
			{actionLabel || action ? (
				<EmptyContent className="pt-2">
					{action ?? <Button>{actionLabel}</Button>}
				</EmptyContent>
			) : null}
		</Empty>
	);
}

export { EmptyState };
