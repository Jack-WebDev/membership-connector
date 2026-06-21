import {
	StatusBadge,
	type StatusBadgeProps,
} from "@membership-connector-app/ui/components/status-badge";
import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function DashboardHeader({
	className,
	title,
	description,
	status,
	actions,
}: React.ComponentProps<"div"> & {
	title: React.ReactNode;
	description?: React.ReactNode;
	status?: StatusBadgeProps;
	actions?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-5 rounded-[calc(var(--radius)*1.25)] border border-border/80 bg-card/90 p-6 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:justify-between",
				className,
			)}
		>
			<div className="space-y-2">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="font-(family-name:--font-display) text-3xl text-foreground">
						{title}
					</h1>
					{status ? <StatusBadge {...status} /> : null}
				</div>
				{description ? (
					<p className="max-w-2xl text-muted-foreground text-sm leading-6">
						{description}
					</p>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
		</div>
	);
}

export { DashboardHeader };
