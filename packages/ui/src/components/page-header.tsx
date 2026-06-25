import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";

function PageHeader({
	className,
	eyebrow,
	title,
	description,
	actions,
	align = "left",
}: React.ComponentProps<"div"> & {
	eyebrow?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	align?: "left" | "center";
}) {
	return (
		<div
			className={cn(
				"hero-panel flex flex-col gap-6 rounded-[calc(var(--radius)*1.5)] border border-white/60 p-8 backdrop-blur-sm sm:p-10",
				align === "center" && "items-center text-center",
				className,
			)}
		>
			<div
				className={cn(
					"flex flex-col gap-3",
					align === "center" && "items-center",
				)}
			>
				{eyebrow ? (
					<div className="font-semibold text-[0.7rem] text-primary uppercase tracking-[0.28em]">
						{eyebrow}
					</div>
				) : null}
				<h1 className="font-(family-name:--font-display) text-4xl text-foreground leading-none sm:text-5xl">
					{title}
				</h1>
				{description ? (
					<p className="max-w-2xl text-muted-foreground text-sm leading-7 sm:text-base">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div
					className={cn(
						"flex flex-wrap items-center gap-3",
						align === "center" ? "justify-center" : "justify-start",
					)}
				>
					{actions}
				</div>
			) : null}
		</div>
	);
}

export { PageHeader };
