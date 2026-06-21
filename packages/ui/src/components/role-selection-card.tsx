import { Button } from "@membership-connector-app/ui/components/button";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import type * as React from "react";

function RoleSelectionCard({
	className,
	title,
	description,
	highlights,
	actionLabel = "Continue",
	action,
}: React.ComponentProps<"div"> & {
	title: string;
	description: string;
	highlights: string[];
	actionLabel?: string;
	action?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex h-full flex-col justify-between gap-6 rounded-[calc(var(--radius)*1.2)] border border-border/80 bg-card/90 p-6 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			<div className="space-y-4">
				<div>
					<h3 className="font-(family-name:--font-display) text-3xl text-foreground">
						{title}
					</h3>
					<p className="mt-2 text-muted-foreground text-sm leading-7">
						{description}
					</p>
				</div>
				<ul className="space-y-2 text-foreground/88 text-sm">
					{highlights.map((highlight) => (
						<li key={highlight} className="flex items-start gap-3">
							<span className="mt-1 size-2 rounded-full bg-primary" />
							<span>{highlight}</span>
						</li>
					))}
				</ul>
			</div>
			<div>
				{action ?? (
					<Button>
						{" "}
						{actionLabel} <ArrowRightIcon />{" "}
					</Button>
				)}
			</div>
		</div>
	);
}

export { RoleSelectionCard };
