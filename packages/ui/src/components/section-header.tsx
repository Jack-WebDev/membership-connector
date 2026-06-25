import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function SectionHeader({
	className,
	eyebrow,
	title,
	description,
	actions,
}: React.ComponentProps<"div"> & {
	eyebrow?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
		>
			<div className="space-y-2">
				{eyebrow ? (
					<div className="font-semibold text-[0.68rem] text-primary uppercase tracking-[0.24em]">
						{eyebrow}
					</div>
				) : null}
				<h2 className="font-(family-name:--font-display) text-3xl text-foreground leading-none">
					{title}
				</h2>
				{description ? (
					<p className="max-w-2xl text-muted-foreground text-sm leading-7">
						{description}
					</p>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
		</div>
	);
}

export { SectionHeader };
