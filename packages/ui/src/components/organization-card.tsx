/** biome-ignore-all lint/a11y/useAnchorContent: biome-ignore lint: false positive, Base UI's render clones the Button's children into the anchor */
import { Button } from "@membership-connector-app/ui/components/button";
import type { OrganizationCardProps } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { ArrowUpRightIcon, Building2Icon, MapPinIcon } from "lucide-react";

function OrganizationCard({
	className,
	name,
	description,
	membershipCount,
	category,
	location,
	highlight,
	ctaLabel = "View organization",
	href,
}: OrganizationCardProps & { className?: string }) {
	return (
		<article
			className={cn(
				"surface-panel group/card flex h-full flex-col gap-5 rounded-[calc(var(--radius)*1.2)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[var(--shadow-soft)]",
				className,
			)}
		>
			<div className="space-y-2">
				{category ? (
					<div className="font-semibold text-[0.68rem] text-primary uppercase tracking-[0.2em]">
						{category}
					</div>
				) : null}
				<h3 className="font-(family-name:--font-display) text-3xl text-foreground leading-none">
					{name}
				</h3>
			</div>
			<p className="flex-1 text-muted-foreground text-sm leading-7">
				{description}
			</p>
			<div className="flex flex-wrap gap-2 text-foreground/85 text-sm">
				<div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.5)]">
					<Building2Icon className="size-4 text-primary" />
					{membershipCount} memberships
				</div>
				{location ? (
					<div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.5)]">
						<MapPinIcon className="size-4 text-primary" />
						{location}
					</div>
				) : null}
			</div>
			{highlight ? (
				<div className="rounded-[calc(var(--radius)*0.9)] border border-white/55 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.74),rgb(233_242_249_/_0.7))] p-4 text-foreground/88 text-sm">
					{highlight}
				</div>
			) : null}
			<Button
				variant="outline"
				className="flex w-fit items-center justify-between justify-self-end"
				render={href ? <a href={href} /> : undefined}
			>
				{ctaLabel}
				<ArrowUpRightIcon className="transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
			</Button>
		</article>
	);
}

export { OrganizationCard };
