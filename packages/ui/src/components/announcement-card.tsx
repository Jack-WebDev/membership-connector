import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { AnnouncementCardProps } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { HeartIcon, MessageCircleIcon, PinIcon } from "lucide-react";

function AnnouncementCard({
	className,
	title,
	body,
	authorName,
	publishedAt,
	visibilityLabel,
	pinned,
	likes = 0,
	comments = 0,
}: AnnouncementCardProps & { className?: string }) {
	return (
		<article
			className={cn(
				"surface-panel rounded-[calc(var(--radius)*1.15)] p-6",
				className,
			)}
		>
			<div className="flex flex-wrap items-center gap-3">
				{pinned ? <StatusBadge label="Pinned" tone="warning" /> : null}
				<StatusBadge label={visibilityLabel} tone="info" />
			</div>
			<div className="mt-4">
				<h3 className="font-(family-name:--font-display) text-3xl text-foreground">
					{title}
				</h3>
				<p className="mt-3 text-muted-foreground text-sm leading-7">{body}</p>
			</div>
			<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-border/70 border-t pt-4 text-muted-foreground text-sm">
				<div className="flex items-center gap-2">
					{pinned ? <PinIcon className="size-4 text-primary" /> : null}
					<span>
						{authorName} • {publishedAt}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="inline-flex items-center gap-2">
						<HeartIcon className="size-4 text-primary" />
						{likes}
					</span>
					<span className="inline-flex items-center gap-2">
						<MessageCircleIcon className="size-4 text-primary" />
						{comments}
					</span>
				</div>
			</div>
		</article>
	);
}

export { AnnouncementCard };
