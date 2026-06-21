import { Badge } from "@membership-connector-app/ui/components/badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";

const toneClasses: Record<StatusBadgeTone, string> = {
	draft: "border-border bg-muted text-muted-foreground",
	active:
		"border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]",
	published:
		"border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]",
	pending:
		"border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/12 text-[color:var(--color-warning)]",
	paused:
		"border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/12 text-[color:var(--color-warning)]",
	archived: "border-border bg-foreground/5 text-muted-foreground",
	success:
		"border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]",
	warning:
		"border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/12 text-[color:var(--color-warning)]",
	danger: "border-destructive/30 bg-destructive/10 text-destructive",
	info: "border-primary/30 bg-primary/10 text-primary",
	muted: "border-border bg-muted text-muted-foreground",
};

export type StatusBadgeProps = {
	label: string;
	tone: StatusBadgeTone;
	className?: string;
};

function StatusBadge({ label, tone, className }: StatusBadgeProps) {
	return (
		<Badge
			className={cn(
				"rounded-full border px-2.5 py-1 font-semibold text-[0.68rem] uppercase tracking-[0.18em]",
				toneClasses[tone],
				className,
			)}
		>
			{label}
		</Badge>
	);
}

export { StatusBadge };
