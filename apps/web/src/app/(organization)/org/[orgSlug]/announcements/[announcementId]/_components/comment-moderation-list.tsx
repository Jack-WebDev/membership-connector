"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	visible: "success",
	hidden: "warning",
	deleted: "muted",
};

type CommentModerationListProps = {
	orgSlug: string;
	announcementId: string;
};

function CommentModerationList({
	orgSlug,
	announcementId,
}: CommentModerationListProps) {
	const router = useRouter();

	const commentsQuery = useQuery(
		trpc.announcement.adminListComments.queryOptions({
			organizationSlug: orgSlug,
			announcementId,
		}),
	);

	const setStatusMutation = useMutation(
		trpc.announcement.adminSetCommentStatus.mutationOptions({
			onSuccess: () => {
				commentsQuery.refetch();
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const comments = commentsQuery.data ?? [];

	if (commentsQuery.isLoading) {
		return null;
	}

	if (comments.length === 0) {
		return (
			<EmptyState
				title="No comments yet"
				description="Comments from members will appear here for moderation."
			/>
		);
	}

	return (
		<div className="space-y-3">
			{comments.map((comment) => (
				<div
					key={comment.id}
					className="flex flex-col gap-3 rounded-[calc(var(--radius)*1.05)] border border-border/80 bg-card/90 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:justify-between"
				>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<span className="font-medium text-foreground">
								{comment.authorName}
							</span>
							<span className="text-muted-foreground">
								{new Date(comment.createdAt).toLocaleString()}
							</span>
							<StatusBadge
								label={comment.status}
								tone={STATUS_TONES[comment.status] ?? "muted"}
							/>
							{comment.parentCommentId ? (
								<span className="text-primary text-xs">Reply</span>
							) : null}
						</div>
						<p className="text-muted-foreground text-sm leading-7">
							{comment.body}
						</p>
					</div>
					{comment.status !== "deleted" ? (
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								setStatusMutation.mutate({
									organizationSlug: orgSlug,
									commentId: comment.id,
									status: comment.status === "hidden" ? "visible" : "hidden",
								})
							}
						>
							{comment.status === "hidden" ? "Unhide" : "Hide"}
						</Button>
					) : null}
				</div>
			))}
		</div>
	);
}

export { CommentModerationList };
