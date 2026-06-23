"use client";

import { AnnouncementCard } from "@membership-connector-app/ui/components/announcement-card";
import { Button } from "@membership-connector-app/ui/components/button";
import { CommentInput } from "@membership-connector-app/ui/components/comment-input";
import { CommentList } from "@membership-connector-app/ui/components/comment-list";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type AnnouncementFeedItem = {
	id: string;
	title: string;
	body: string;
	authorName: string;
	publishedAt: string;
	visibilityLabel: string;
	pinned: boolean;
	likesCount: number;
	commentsCount: number;
	likedByMe: boolean;
};

function MemberAnnouncementFeed({
	announcements,
}: {
	announcements: AnnouncementFeedItem[];
}) {
	if (announcements.length === 0) {
		return (
			<EmptyState
				title="No announcements yet"
				description="When this organization publishes an announcement, it will show up here."
			/>
		);
	}

	return (
		<div className="space-y-4">
			{announcements.map((announcement) => (
				<AnnouncementFeedCard
					key={announcement.id}
					announcement={announcement}
				/>
			))}
		</div>
	);
}

function AnnouncementFeedCard({
	announcement,
}: {
	announcement: AnnouncementFeedItem;
}) {
	const { data: session } = authClient.useSession();
	const [expanded, setExpanded] = useState(false);
	const [liked, setLiked] = useState(announcement.likedByMe);
	const [likesCount, setLikesCount] = useState(announcement.likesCount);
	const [commentsCount, setCommentsCount] = useState(
		announcement.commentsCount,
	);

	const likeMutation = useMutation(
		trpc.announcement.toggleLike.mutationOptions({
			onError: (error) => {
				toast.error(error.message);
				setLiked(announcement.likedByMe);
				setLikesCount(announcement.likesCount);
			},
		}),
	);

	function handleToggleLike() {
		const nextLiked = !liked;
		setLiked(nextLiked);
		setLikesCount((count) => count + (nextLiked ? 1 : -1));
		likeMutation.mutate({ announcementId: announcement.id });
	}

	return (
		<div className="space-y-3">
			<AnnouncementCard
				title={announcement.title}
				body={announcement.body}
				authorName={announcement.authorName}
				publishedAt={announcement.publishedAt}
				visibilityLabel={announcement.visibilityLabel}
				pinned={announcement.pinned}
				likes={likesCount}
				comments={commentsCount}
			/>
			<div className="flex flex-wrap items-center gap-3 px-1">
				<Button
					size="sm"
					variant={liked ? "default" : "outline"}
					onClick={handleToggleLike}
				>
					<HeartIcon className={liked ? "fill-current" : undefined} />
					{liked ? "Liked" : "Like"}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setExpanded((value) => !value)}
				>
					<MessageCircleIcon />
					{expanded ? "Hide comments" : "Comments"}
				</Button>
			</div>
			{expanded ? (
				<AnnouncementComments
					announcementId={announcement.id}
					currentUserId={session?.user.id}
					onCommentCountChange={(delta) =>
						setCommentsCount((count) => count + delta)
					}
				/>
			) : null}
		</div>
	);
}

function AnnouncementComments({
	announcementId,
	currentUserId,
	onCommentCountChange,
}: {
	announcementId: string;
	currentUserId?: string;
	onCommentCountChange: (delta: number) => void;
}) {
	const [replyTo, setReplyTo] = useState<{
		id: string;
		authorName: string;
	} | null>(null);

	const commentsQuery = useQuery(
		trpc.announcement.listComments.queryOptions({ announcementId }),
	);

	const addCommentMutation = useMutation(
		trpc.announcement.addComment.mutationOptions({
			onSuccess: () => {
				commentsQuery.refetch();
				setReplyTo(null);
				onCommentCountChange(1);
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const deleteCommentMutation = useMutation(
		trpc.announcement.deleteComment.mutationOptions({
			onSuccess: () => {
				commentsQuery.refetch();
				onCommentCountChange(-1);
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const comments = commentsQuery.data ?? [];
	const commentsById = new Map(
		comments.map((comment) => [comment.id, comment]),
	);

	return (
		<div className="space-y-4 rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-muted/20 p-4">
			{comments.length > 0 ? (
				<div className="space-y-2">
					{comments.map((comment) => (
						<div key={comment.id} className="space-y-1">
							<CommentList
								comments={[
									{
										id: comment.id,
										authorName: comment.authorName,
										body: comment.body,
										createdAt: new Date(comment.createdAt).toLocaleString(),
										status: comment.status,
										replyTo: comment.parentCommentId
											? commentsById.get(comment.parentCommentId)?.authorName
											: undefined,
									},
								]}
							/>
							<div className="flex gap-2 px-1">
								{!comment.parentCommentId ? (
									<Button
										size="sm"
										variant="ghost"
										onClick={() =>
											setReplyTo({
												id: comment.id,
												authorName: comment.authorName,
											})
										}
									>
										Reply
									</Button>
								) : null}
								{comment.authorUserId === currentUserId ? (
									<Button
										size="sm"
										variant="ghost"
										onClick={() =>
											deleteCommentMutation.mutate({ commentId: comment.id })
										}
									>
										Delete
									</Button>
								) : null}
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-muted-foreground text-sm">
					Be the first to comment.
				</p>
			)}

			{replyTo ? (
				<p className="text-muted-foreground text-xs">
					Replying to {replyTo.authorName}.{" "}
					<button
						type="button"
						className="text-primary underline"
						onClick={() => setReplyTo(null)}
					>
						Cancel
					</button>
				</p>
			) : null}

			<CommentInput
				label={replyTo ? `Reply to ${replyTo.authorName}` : "Add a comment"}
				submitLabel={replyTo ? "Post reply" : "Post comment"}
				isSubmitting={addCommentMutation.isPending}
				onSubmit={(body) =>
					addCommentMutation.mutate({
						announcementId,
						body,
						parentCommentId: replyTo?.id,
					})
				}
			/>
		</div>
	);
}

export { MemberAnnouncementFeed };
