/** biome-ignore-all lint/a11y/useAnchorContent: biome-ignore lint: false positive, Base UI's render clones the Button's children into the anchor */
import { Button } from "@membership-connector-app/ui/components/button";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { MembershipCardProps } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { ArrowUpRightIcon } from "lucide-react";

function MembershipCard({
	className,
	name,
	organizationName,
	shortDescription,
	category,
	startingPrice,
	billingInterval,
	activeTiers,
	status,
	ctaLabel = "View membership",
	metaLabel = "Available tiers",
	href,
}: MembershipCardProps & { className?: string }) {
	return (
		<article
			className={cn(
				"group/card flex h-full flex-col gap-5 rounded-[calc(var(--radius)*1.2)] border border-border/80 bg-card/90 p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-2">
					<div className="font-semibold text-[0.68rem] text-primary uppercase tracking-[0.2em]">
						{organizationName}
					</div>
					<h3 className="font-(family-name:--font-display) text-3xl text-foreground leading-none">
						{name}
					</h3>
				</div>
				{status ? <StatusBadge label={status} tone="published" /> : null}
			</div>
			<p className="flex-1 text-muted-foreground text-sm leading-7">
				{shortDescription}
			</p>
			<div className="grid grid-cols-2 gap-3 rounded-[calc(var(--radius)*0.95)] bg-muted/55 p-4 text-sm">
				<div>
					<div className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.18em]">
						Category
					</div>
					<div className="mt-1 text-foreground">{category}</div>
				</div>
				<div>
					<div className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.18em]">
						{metaLabel}
					</div>
					<div className="mt-1 text-foreground">{activeTiers}</div>
				</div>
				<div className="col-span-2">
					<div className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.18em]">
						Starting at
					</div>
					<div className="mt-1 flex items-end gap-2">
						<span className="font-(family-name:--font-display) text-3xl text-foreground leading-none">
							{startingPrice}
						</span>
						<span className="text-muted-foreground">{billingInterval}</span>
					</div>
				</div>
			</div>
			<Button
				className="w-fit justify-between"
				render={href ? <a href={href} /> : undefined}
			>
				{ctaLabel}
				<ArrowUpRightIcon className="transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
			</Button>
		</article>
	);
}

export { MembershipCard };
