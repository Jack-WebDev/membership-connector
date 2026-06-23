import { db } from "@membership-connector-app/db";
import {
	announcementComments,
	announcementLikes,
	announcements,
} from "@membership-connector-app/db/schema/announcement";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import {
	membershipMembers,
	memberships,
	membershipTiers,
} from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";

import { findOrganizationMembershipOrThrow } from "../membership/service";
import {
	createNotification,
	notifyOrganizationAdmins,
} from "../notification/service";
import type {
	AddCommentInput,
	AdminAnnouncementDetail,
	AdminAnnouncementFilterOptions,
	AdminAnnouncementSummary,
	AdminCommentSummary,
	AnnouncementStatus,
	CreateAnnouncementInput,
	ListAdminAnnouncementsInput,
	MemberAnnouncementSummary,
	MemberCommentSummary,
	UpdateAnnouncementInput,
} from "./types";

const ACTIVE_MEMBER_STATUSES = ["active", "pending_payment"] as const;
const MEMBER_VISIBLE_VISIBILITIES = [
	"public",
	"members_only",
	"tier_specific",
] as const;

const VISIBILITY_LABELS: Record<string, string> = {
	public: "Public",
	members_only: "Members only",
	tier_specific: "Tier specific",
	admins_only: "Admins only",
};

const ANNOUNCEMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
	draft: ["published"],
	published: ["archived"],
	archived: [],
};

async function assertActiveMembership(
	executor: DbExecutor,
	userId: string,
	membershipId: string,
) {
	const member = await executor.query.membershipMembers.findFirst({
		where: and(
			eq(membershipMembers.userId, userId),
			eq(membershipMembers.membershipId, membershipId),
			inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
		),
	});

	if (!member) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this membership's announcements",
		});
	}

	return member;
}

async function findViewableAnnouncementForMember(
	executor: DbExecutor,
	userId: string,
	announcementId: string,
) {
	const announcement = await executor.query.announcements.findFirst({
		where: eq(announcements.id, announcementId),
		with: { membership: true },
	});

	if (announcement?.status !== "published") {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Announcement not found",
		});
	}

	if (announcement.visibility === "admins_only") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this announcement",
		});
	}

	const member = await assertActiveMembership(
		executor,
		userId,
		announcement.membershipId,
	);

	if (
		announcement.visibility === "tier_specific" &&
		announcement.targetMembershipTierId !== member.membershipTierId
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this announcement",
		});
	}

	return announcement;
}

type MemberVisibleAnnouncementRow = {
	id: string;
	membershipId: string;
	title: string;
	body: string;
	authorUser: { name: string };
	publishedAt: Date | null;
	pinned: boolean;
	visibility: string;
	targetMembershipTierId: string | null;
	likes: { userId: string }[];
	comments: { id: string }[];
};

function toMemberSummary(
	row: MemberVisibleAnnouncementRow,
	userId: string,
): MemberAnnouncementSummary {
	return {
		id: row.id,
		title: row.title,
		body: row.body,
		authorName: row.authorUser.name,
		publishedAt: row.publishedAt ?? new Date(0),
		pinned: row.pinned,
		visibilityLabel: VISIBILITY_LABELS[row.visibility] ?? row.visibility,
		likesCount: row.likes.length,
		commentsCount: row.comments.length,
		likedByMe: row.likes.some((like) => like.userId === userId),
	};
}

async function listVisibleAnnouncementsForMemberships(
	userId: string,
	members: { membershipId: string; membershipTierId: string }[],
): Promise<MemberAnnouncementSummary[]> {
	const membershipIds = [...new Set(members.map((row) => row.membershipId))];

	if (membershipIds.length === 0) {
		return [];
	}

	const tierByMembership = new Map(
		members.map((row) => [row.membershipId, row.membershipTierId]),
	);

	const rows = await db.query.announcements.findMany({
		where: and(
			inArray(announcements.membershipId, membershipIds),
			eq(announcements.status, "published"),
			inArray(announcements.visibility, MEMBER_VISIBLE_VISIBILITIES),
		),
		with: {
			authorUser: true,
			likes: { columns: { userId: true } },
			comments: {
				where: eq(announcementComments.status, "visible"),
				columns: { id: true },
			},
		},
		orderBy: (table, { desc }) => [desc(table.pinned), desc(table.publishedAt)],
	});

	return rows
		.filter(
			(row) =>
				row.visibility !== "tier_specific" ||
				row.targetMembershipTierId === tierByMembership.get(row.membershipId),
		)
		.map((row) => toMemberSummary(row, userId));
}

export async function listVisibleAnnouncementsForMembershipMember(
	userId: string,
	membershipId: string,
): Promise<MemberAnnouncementSummary[]> {
	const member = await assertActiveMembership(db, userId, membershipId);

	return listVisibleAnnouncementsForMemberships(userId, [
		{ membershipId, membershipTierId: member.membershipTierId },
	]);
}

export async function listRecentAnnouncementsForUser(
	userId: string,
	limit = 5,
): Promise<MemberAnnouncementSummary[]> {
	const members = await db.query.membershipMembers.findMany({
		where: and(
			eq(membershipMembers.userId, userId),
			inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
		),
		columns: { membershipId: true, membershipTierId: true },
	});

	const rows = await listVisibleAnnouncementsForMemberships(userId, members);

	return rows
		.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
		.slice(0, limit);
}

export async function toggleAnnouncementLike(
	userId: string,
	announcementId: string,
): Promise<{ liked: boolean }> {
	return db.transaction(async (tx) => {
		const announcement = await findViewableAnnouncementForMember(
			tx,
			userId,
			announcementId,
		);

		const existing = await tx.query.announcementLikes.findFirst({
			where: and(
				eq(announcementLikes.announcementId, announcementId),
				eq(announcementLikes.userId, userId),
			),
		});

		if (existing) {
			await tx
				.delete(announcementLikes)
				.where(eq(announcementLikes.id, existing.id));
			return { liked: false };
		}

		await tx.insert(announcementLikes).values({
			id: crypto.randomUUID(),
			announcementId,
			userId,
		});

		await notifyOrganizationAdmins(
			tx,
			announcement.organizationId,
			"manage_announcements",
			{
				type: "announcement.liked",
				title: "New like on announcement",
				body: `"${announcement.title}" received a new like.`,
				data: { announcementId },
			},
		);

		return { liked: true };
	});
}

export async function listCommentsForMember(
	userId: string,
	announcementId: string,
): Promise<MemberCommentSummary[]> {
	await findViewableAnnouncementForMember(db, userId, announcementId);

	const rows = await db.query.announcementComments.findMany({
		where: and(
			eq(announcementComments.announcementId, announcementId),
			eq(announcementComments.status, "visible"),
		),
		with: { user: true },
		orderBy: (table, { asc }) => asc(table.createdAt),
	});

	return rows.map((row) => ({
		id: row.id,
		authorUserId: row.userId,
		authorName: row.user.name,
		body: row.body,
		status: row.status,
		createdAt: row.createdAt,
		parentCommentId: row.parentCommentId,
	}));
}

export async function addComment(
	userId: string,
	input: AddCommentInput,
): Promise<{ commentId: string }> {
	return db.transaction(async (tx) => {
		const announcement = await findViewableAnnouncementForMember(
			tx,
			userId,
			input.announcementId,
		);

		let parentComment:
			| Awaited<ReturnType<typeof tx.query.announcementComments.findFirst>>
			| undefined;

		if (input.parentCommentId) {
			parentComment = await tx.query.announcementComments.findFirst({
				where: eq(announcementComments.id, input.parentCommentId),
			});

			if (
				!parentComment ||
				parentComment.announcementId !== input.announcementId
			) {
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
		}

		const commentId = crypto.randomUUID();

		await tx.insert(announcementComments).values({
			id: commentId,
			announcementId: input.announcementId,
			userId,
			parentCommentId: input.parentCommentId ?? null,
			body: input.body,
			status: "visible",
		});

		await notifyOrganizationAdmins(
			tx,
			announcement.organizationId,
			"manage_announcements",
			{
				type: "comment.created",
				title: "New comment on announcement",
				body: `A member commented on "${announcement.title}".`,
				data: { announcementId: input.announcementId, commentId },
			},
		);

		if (parentComment && parentComment.userId !== userId) {
			await createNotification(tx, {
				userId: parentComment.userId,
				type: "comment.reply_received",
				title: "New reply to your comment",
				body: `Someone replied to your comment on "${announcement.title}".`,
				data: { announcementId: input.announcementId, commentId },
			});
		}

		return { commentId };
	});
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

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId: comment.announcement.organizationId,
			actorUserId: userId,
			action: "comment.deleted",
			entityType: "announcement_comment",
			entityId: commentId,
			metadata: { announcementId: comment.announcementId },
		});
	});
}

async function resolveTargetTier(
	executor: DbExecutor,
	input: {
		membershipId: string;
		visibility: string;
		targetMembershipTierId?: string;
	},
): Promise<string | null> {
	if (input.visibility !== "tier_specific") {
		return null;
	}

	if (!input.targetMembershipTierId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A target tier is required for tier-specific announcements",
		});
	}

	const tier = await executor.query.membershipTiers.findFirst({
		where: eq(membershipTiers.id, input.targetMembershipTierId),
	});

	if (!tier || tier.membershipId !== input.membershipId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
	}

	return tier.id;
}

async function findOrganizationAnnouncementOrThrow(
	executor: DbExecutor,
	organizationId: string,
	announcementId: string,
) {
	const announcement = await executor.query.announcements.findFirst({
		where: and(
			eq(announcements.id, announcementId),
			eq(announcements.organizationId, organizationId),
		),
		with: { membership: true, targetTier: true, likes: true, comments: true },
	});

	if (!announcement) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Announcement not found",
		});
	}

	return announcement;
}

type OrganizationAnnouncementWithRelations = Awaited<
	ReturnType<typeof findOrganizationAnnouncementOrThrow>
>;

type AnnouncementSummaryRow = {
	id: string;
	title: string;
	status: AnnouncementStatus;
	visibility: OrganizationAnnouncementWithRelations["visibility"];
	membershipId: string;
	membership: { name: string };
	pinned: boolean;
	likes: unknown[];
	comments: unknown[];
	publishedAt: Date | null;
	updatedAt: Date;
};

function toAdminSummary(row: AnnouncementSummaryRow): AdminAnnouncementSummary {
	return {
		id: row.id,
		title: row.title,
		status: row.status,
		visibility: row.visibility,
		membershipId: row.membershipId,
		membershipName: row.membership.name,
		pinned: row.pinned,
		likesCount: row.likes.length,
		commentsCount: row.comments.length,
		publishedAt: row.publishedAt,
		updatedAt: row.updatedAt,
	};
}

export async function createAnnouncement(
	organizationId: string,
	userId: string,
	input: CreateAnnouncementInput,
): Promise<{ announcementId: string }> {
	const announcementId = crypto.randomUUID();

	await db.transaction(async (tx) => {
		const membership = await findOrganizationMembershipOrThrow(
			tx,
			organizationId,
			input.membershipId,
		);

		const targetMembershipTierId = await resolveTargetTier(tx, input);

		await tx.insert(announcements).values({
			id: announcementId,
			organizationId,
			membershipId: membership.id,
			authorUserId: userId,
			title: input.title,
			body: input.body,
			visibility: input.visibility,
			targetMembershipTierId,
			status: "draft",
		});

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: "announcement.created",
			entityType: "announcement",
			entityId: announcementId,
			metadata: { membershipId: input.membershipId, title: input.title },
		});
	});

	return { announcementId };
}

export async function updateAnnouncement(
	organizationId: string,
	userId: string,
	input: UpdateAnnouncementInput,
): Promise<void> {
	await db.transaction(async (tx) => {
		const announcement = await findOrganizationAnnouncementOrThrow(
			tx,
			organizationId,
			input.announcementId,
		);

		if (announcement.status !== "draft") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Only draft announcements can be edited",
			});
		}

		if (input.membershipId !== announcement.membershipId) {
			await findOrganizationMembershipOrThrow(
				tx,
				organizationId,
				input.membershipId,
			);
		}

		const targetMembershipTierId = await resolveTargetTier(tx, input);

		await tx
			.update(announcements)
			.set({
				membershipId: input.membershipId,
				title: input.title,
				body: input.body,
				visibility: input.visibility,
				targetMembershipTierId,
			})
			.where(eq(announcements.id, input.announcementId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: "announcement.updated",
			entityType: "announcement",
			entityId: input.announcementId,
			metadata: { title: input.title },
		});
	});
}

export async function transitionAnnouncementStatus(
	organizationId: string,
	userId: string,
	announcementId: string,
	target: "published" | "archived",
): Promise<void> {
	await db.transaction(async (tx) => {
		const announcement = await findOrganizationAnnouncementOrThrow(
			tx,
			organizationId,
			announcementId,
		);

		const allowedTargets =
			ANNOUNCEMENT_STATUS_TRANSITIONS[announcement.status] ?? [];

		if (!allowedTargets.includes(target)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot move an announcement from "${announcement.status}" to "${target}"`,
			});
		}

		const now = new Date();

		await tx
			.update(announcements)
			.set({
				status: target,
				...(target === "published" ? { publishedAt: now } : {}),
			})
			.where(eq(announcements.id, announcementId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: `announcement.${target}`,
			entityType: "announcement",
			entityId: announcementId,
			metadata: { from: announcement.status, to: target },
		});

		if (target === "published" && announcement.visibility !== "admins_only") {
			const recipients = await tx.query.membershipMembers.findMany({
				where: and(
					eq(membershipMembers.membershipId, announcement.membershipId),
					inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
					...(announcement.visibility === "tier_specific" &&
					announcement.targetMembershipTierId
						? [
								eq(
									membershipMembers.membershipTierId,
									announcement.targetMembershipTierId,
								),
							]
						: []),
				),
				columns: { userId: true },
			});

			const recipientUserIds = [
				...new Set(recipients.map((row) => row.userId)),
			];

			for (const recipientUserId of recipientUserIds) {
				await createNotification(tx, {
					userId: recipientUserId,
					type: "announcement.published",
					title: "New announcement",
					body: `${announcement.membership.name} posted: ${announcement.title}`,
					data: { announcementId, membershipId: announcement.membershipId },
				});
			}
		}
	});
}

export async function toggleAnnouncementPin(
	organizationId: string,
	userId: string,
	announcementId: string,
	pinned: boolean,
): Promise<void> {
	await db.transaction(async (tx) => {
		await findOrganizationAnnouncementOrThrow(
			tx,
			organizationId,
			announcementId,
		);

		await tx
			.update(announcements)
			.set({ pinned })
			.where(eq(announcements.id, announcementId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: pinned ? "announcement.pinned" : "announcement.unpinned",
			entityType: "announcement",
			entityId: announcementId,
			metadata: {},
		});
	});
}

export async function listAdminAnnouncements(
	organizationId: string,
	input: ListAdminAnnouncementsInput,
): Promise<{ items: AdminAnnouncementSummary[]; total: number }> {
	const rows = await db.query.announcements.findMany({
		where: eq(announcements.organizationId, organizationId),
		with: { membership: true, likes: true, comments: true },
	});

	const search = input.search?.trim().toLowerCase();

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter((row) => !input.visibility || row.visibility === input.visibility)
		.filter(
			(row) => !input.membershipId || row.membershipId === input.membershipId,
		)
		.filter((row) => input.pinned === undefined || row.pinned === input.pinned)
		.filter((row) => {
			if (!search) return true;

			return [row.title, row.body, row.membership.name]
				.join(" ")
				.toLowerCase()
				.includes(search);
		})
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "title") {
				return a.title.localeCompare(b.title) * direction;
			}

			return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return { items: page.map(toAdminSummary), total };
}

export async function listAnnouncementFilterOptions(
	organizationId: string,
): Promise<AdminAnnouncementFilterOptions> {
	const orgMemberships = await db.query.memberships.findMany({
		where: eq(memberships.organizationId, organizationId),
		columns: { id: true, name: true },
	});

	return { memberships: orgMemberships };
}

export async function getAdminAnnouncementById(
	organizationId: string,
	announcementId: string,
): Promise<AdminAnnouncementDetail> {
	const announcement = await findOrganizationAnnouncementOrThrow(
		db,
		organizationId,
		announcementId,
	);

	return {
		...toAdminSummary(announcement),
		body: announcement.body,
		targetMembershipTierId: announcement.targetMembershipTierId,
		targetTierName: announcement.targetTier?.name ?? null,
		createdAt: announcement.createdAt,
	};
}

export async function listCommentsForAnnouncementAdmin(
	organizationId: string,
	announcementId: string,
): Promise<AdminCommentSummary[]> {
	await findOrganizationAnnouncementOrThrow(db, organizationId, announcementId);

	const rows = await db.query.announcementComments.findMany({
		where: eq(announcementComments.announcementId, announcementId),
		with: { user: true },
		orderBy: (table, { asc }) => asc(table.createdAt),
	});

	return rows.map((row) => ({
		id: row.id,
		authorUserId: row.userId,
		authorName: row.user.name,
		body: row.body,
		status: row.status,
		createdAt: row.createdAt,
		parentCommentId: row.parentCommentId,
	}));
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

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: target === "hidden" ? "comment.hidden" : "comment.unhidden",
			entityType: "announcement_comment",
			entityId: commentId,
			metadata: { announcementId: comment.announcementId },
		});
	});
}

export type { AnnouncementStatus };
