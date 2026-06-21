import { Skeleton } from "@membership-connector-app/ui/components/skeleton";
import { cn } from "@membership-connector-app/ui/lib/utils";

function LoadingState({
	className,
	title = "Loading content",
	description = "Preparing the next section of the workspace.",
	rows = 3,
}: {
	className?: string;
	title?: string;
	description?: string;
	rows?: number;
}) {
	return (
		<div
			className={cn(
				"rounded-[calc(var(--radius)*1.25)] border border-border/80 bg-card/80 p-6 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			<div className="space-y-2">
				<div className="font-(family-name:--font-display) text-2xl text-foreground">
					{title}
				</div>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
			<div className="mt-6 space-y-3">
				{Array.from({ length: rows }).map((_, index) => (
					<Skeleton
						key={index}
						className={cn(
							"h-14 rounded-[calc(var(--radius)*0.9)]",
							index === 0 && "w-full",
							index === 1 && "w-[92%]",
							index > 1 && "w-[84%]",
						)}
					/>
				))}
			</div>
		</div>
	);
}

export { LoadingState };
