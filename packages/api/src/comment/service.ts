import { db } from "@membership-connector-app/db";
import { announcementComments } from "@membership-connector-app/db/schema/announcement";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type {
	AddCommentInput,
	AdminCommentSummary,
	MemberCommentSummary,
} from "../announcement/types";
import { recordAuditLog } from "../audit-log/service";

function toCommentSummary(row: {
	id: string;
	userId: string;
	user: { name: string };
	body: string;
	status: "visible" | "hidden" | "deleted";
	createdAt: Date;
	parentCommentId: string | null;
}): MemberCommentSummary | AdminCommentSummary {
	return {
		id: row.id,
		authorUserId: row.userId,
		authorName: row.user.name,
		body: row.body,
		status: row.status,
		createdAt: row.createdAt,
		parentCommentId: row.parentCommentId,
	};
}

export async function listVisibleCommentsForAnnouncement(
	executor: DbExecutor,
	announcementId: string,
): Promise<MemberCommentSummary[]> {
	const rows = await executor.query.announcementComments.findMany({
		where: and(
			eq(announcementComments.announcementId, announcementId),
			eq(announcementComments.status, "visible"),
		),
		with: { user: true },
		orderBy: (table, { asc }) => asc(table.createdAt),
	});

	return rows.map(toCommentSummary);
}

export async function listAnnouncementCommentsForAdmin(
	executor: DbExecutor,
	announcementId: string,
): Promise<AdminCommentSummary[]> {
	const rows = await executor.query.announcementComments.findMany({
		where: eq(announcementComments.announcementId, announcementId),
		with: { user: true },
		orderBy: (table, { asc }) => asc(table.createdAt),
	});

	return rows.map(toCommentSummary);
}

export async function findParentComment(
	executor: DbExecutor,
	announcementId: string,
	parentCommentId: string,
) {
	const parentComment = await executor.query.announcementComments.findFirst({
		where: eq(announcementComments.id, parentCommentId),
	});

	if (!parentComment || parentComment.announcementId !== announcementId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Comment not found",
		});
	}

	if (parentComment.parentCommentId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Replies can only be one level deep",
		});
	}

	return parentComment;
}

export async function insertComment(
	executor: DbExecutor,
	params: {
		announcementId: string;
		userId: string;
		parentCommentId: AddCommentInput["parentCommentId"];
		body: string;
	},
): Promise<{ commentId: string }> {
	const commentId = crypto.randomUUID();

	await executor.insert(announcementComments).values({
		id: commentId,
		announcementId: params.announcementId,
		userId: params.userId,
		parentCommentId: params.parentCommentId ?? null,
		body: params.body,
		status: "visible",
	});

	return { commentId };
}

export async function deleteOwnComment(
	userId: string,
	commentId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const comment = await tx.query.announcementComments.findFirst({
			where: and(
				eq(announcementComments.id, commentId),
				eq(announcementComments.userId, userId),
			),
			with: { announcement: true },
		});

		if (!comment) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Comment not found",
			});
		}

		if (comment.status === "deleted") {
			return;
		}

		await tx
			.update(announcementComments)
			.set({ status: "deleted" })
			.where(eq(announcementComments.id, commentId));

		await recordAuditLog(tx, {
			organizationId: comment.announcement.organizationId,
			actorUserId: userId,
			action: "comment.deleted",
			entityType: "announcement_comment",
			entityId: commentId,
			metadata: { announcementId: comment.announcementId },
		});
	});
}

export async function setCommentStatus(
	organizationId: string,
	userId: string,
	commentId: string,
	target: "visible" | "hidden",
): Promise<void> {
	await db.transaction(async (tx) => {
		const comment = await tx.query.announcementComments.findFirst({
			where: eq(announcementComments.id, commentId),
			with: { announcement: true },
		});

		if (!comment || comment.announcement.organizationId !== organizationId) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Comment not found",
			});
		}

		if (comment.status === "deleted") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Deleted comments cannot be moderated",
			});
		}

		await tx
			.update(announcementComments)
			.set({ status: target })
			.where(eq(announcementComments.id, commentId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: target === "hidden" ? "comment.hidden" : "comment.unhidden",
			entityType: "announcement_comment",
			entityId: commentId,
			metadata: { announcementId: comment.announcementId },
		});
	});
}
