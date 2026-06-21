import type { CommentItem } from "@membership-connector-app/ui/lib/app-types";
import { cn } from "@membership-connector-app/ui/lib/utils";

function CommentList({
	className,
	comments,
}: {
	className?: string;
	comments: CommentItem[];
}) {
	return (
		<div className={cn("space-y-4", className)}>
			{comments.map((comment) => (
				<div
					key={comment.id}
					className="rounded-[calc(var(--radius)*1.05)] border border-border/80 bg-card/90 p-4 shadow-[var(--shadow-card)]"
				>
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<span className="font-medium text-foreground">
							{comment.authorName}
						</span>
						<span className="text-muted-foreground">{comment.createdAt}</span>
						{comment.replyTo ? (
							<span className="text-primary">
								Replying to {comment.replyTo}
							</span>
						) : null}
					</div>
					<p className="mt-3 text-muted-foreground text-sm leading-7">
						{comment.status === "deleted"
							? "This comment was deleted."
							: comment.body}
					</p>
				</div>
			))}
		</div>
	);
}

export { CommentList };
