import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function StatCard({
	className,
	label,
	value,
	description,
	indicator,
	icon,
}: React.ComponentProps<"div"> & {
	label: string;
	value: React.ReactNode;
	description?: React.ReactNode;
	indicator?: {
		label: string;
		tone: Parameters<typeof StatusBadge>[0]["tone"];
	};
	icon?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"rounded-[calc(var(--radius)*1.15)] border border-border/80 bg-card/90 p-5 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-2">
					<div className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
						{label}
					</div>
					<div className="font-(family-name:--font-display) text-4xl text-foreground leading-none">
						{value}
					</div>
				</div>
				{icon ? (
					<div className="rounded-full border border-border/80 bg-muted p-3 text-primary">
						{icon}
					</div>
				) : null}
			</div>
			<div className="mt-4 flex flex-wrap items-center gap-3">
				{indicator ? (
					<StatusBadge label={indicator.label} tone={indicator.tone} />
				) : null}
				{description ? (
					<p className="text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
		</div>
	);
}

export { StatCard };
