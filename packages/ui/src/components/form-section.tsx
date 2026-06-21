import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function FormSection({
	className,
	title,
	description,
	children,
}: React.ComponentProps<"section"> & {
	title: React.ReactNode;
	description?: React.ReactNode;
}) {
	return (
		<section
			className={cn(
				"rounded-[calc(var(--radius)*1.15)] border border-border/80 bg-card/90 p-6 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			<div className="border-border/70 border-b pb-4">
				<h3 className="font-(family-name:--font-display) text-2xl text-foreground">
					{title}
				</h3>
				{description ? (
					<p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
						{description}
					</p>
				) : null}
			</div>
			<div className="mt-5 space-y-4">{children}</div>
		</section>
	);
}

export { FormSection };
