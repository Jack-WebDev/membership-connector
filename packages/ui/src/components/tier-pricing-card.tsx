/** biome-ignore-all lint/a11y/useAnchorContent: biome-ignore lint: false positive, Base UI's render clones the Button's children into the anchor */
import { Button } from "@membership-connector-app/ui/components/button";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { TierPricingCardProps } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { CheckIcon } from "lucide-react";

function TierPricingCard({
	className,
	name,
	description,
	price,
	billingInterval,
	benefits,
	requirements,
	status,
	statusTone = "active",
	href,
	disabled,
	actionLabel = "Select tier",
}: TierPricingCardProps & { className?: string }) {
	return (
		<article
			className={cn(
				"surface-panel flex h-full flex-col gap-5 rounded-[calc(var(--radius)*1.2)] p-6",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-(family-name:--font-display) text-3xl text-foreground">
						{name}
					</h3>
					<p className="mt-2 text-muted-foreground text-sm leading-7">
						{description}
					</p>
				</div>
				{status ? <StatusBadge label={status} tone={statusTone} /> : null}
			</div>
			<div className="rounded-[calc(var(--radius)*0.95)] border border-white/55 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.8),rgb(232_241_249_/_0.75))] p-5">
				<div className="font-(family-name:--font-display) text-4xl text-foreground">
					{price}
				</div>
				<div className="mt-1 text-muted-foreground text-sm">
					{billingInterval}
				</div>
			</div>
			<div className="space-y-4 text-sm">
				<div>
					<div className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
						Benefits
					</div>
					<ul className="mt-3 space-y-2">
						{benefits.map((benefit) => (
							<li key={benefit} className="flex gap-2 text-foreground/90">
								<CheckIcon className="mt-0.5 size-4 text-primary" />
								<span>{benefit}</span>
							</li>
						))}
					</ul>
				</div>
				{requirements?.length ? (
					<div>
						<div className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
							Requirements
						</div>
						<ul className="mt-3 space-y-2 text-muted-foreground">
							{requirements.map((requirement) => (
								<li key={requirement}>{requirement}</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
			<Button
				className="mt-auto w-full"
				disabled={disabled || !href}
				render={href && !disabled ? <a href={href} /> : undefined}
			>
				{actionLabel}
			</Button>
		</article>
	);
}

export { TierPricingCard };
