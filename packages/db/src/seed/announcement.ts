import { eq } from "drizzle-orm";
import { db } from "../client";
import {
	announcementComments,
	announcementLikes,
	announcements,
} from "../schema/announcement";
import {
	type AdminKey,
	type AnnouncementKey,
	adminDefs,
	announcementAuthors,
	announcementDefs,
	commentBodies,
	type MemberKey,
	type MembershipKey,
	type OrgKey,
	type TierKey,
	tierSpecificAnnouncements,
	viewableByMembership,
} from "./data";
import type { ActiveMembership } from "./membership";

export async function seedAnnouncements(
	orgIds: Record<OrgKey, string>,
	membershipIds: Record<MembershipKey, string>,
	tierIds: Record<TierKey, string>,
	ownerIds: Record<OrgKey, string>,
	adminIds: Record<AdminKey, string>,
): Promise<Record<AnnouncementKey, string>> {
	const announcementIds = {} as Record<AnnouncementKey, string>;

	for (const def of announcementDefs) {
		const author = announcementAuthors[def.membershipKey];
		const authorOrgKey =
			author.type === "owner"
				? author.orgKey
				: adminDefs[author.adminKey].orgKey;
		const authorUserId =
			author.type === "owner"
				? ownerIds[author.orgKey]
				: adminIds[author.adminKey];
		const orgId = orgIds[authorOrgKey];
		const announcementId = crypto.randomUUID();

		await db.insert(announcements).values({
			id: announcementId,
			organizationId: orgId,
			membershipId: membershipIds[def.membershipKey],
			authorUserId,
			title: def.title,
			body: def.body,
			visibility: def.visibility,
			status: def.status,
			pinned: def.pinned ?? false,
			publishedAt:
				def.status === "published" || def.status === "archived"
					? new Date()
					: null,
			targetMembershipTierId: def.targetTierKey
				? tierIds[def.targetTierKey]
				: null,
		});

		announcementIds[def.key] = announcementId;
	}

	return announcementIds;
}

export async function seedAnnouncementEngagement(
	activeMemberships: ActiveMembership[],
	memberIds: Record<MemberKey, string>,
	announcementIds: Record<AnnouncementKey, string>,
): Promise<void> {
	type ViewablePair = {
		memberKey: MemberKey;
		announcementKey: AnnouncementKey;
	};
	const viewablePairs: ViewablePair[] = [];

	for (const active of activeMemberships) {
		for (const announcementKey of viewableByMembership[active.membershipKey]) {
			viewablePairs.push({ memberKey: active.memberKey, announcementKey });
		}

		const tierSpecific = tierSpecificAnnouncements.find(
			(a) =>
				a.membershipKey === active.membershipKey &&
				a.tierKey === active.tierKey,
		);
		if (tierSpecific) {
			viewablePairs.push({
				memberKey: active.memberKey,
				announcementKey: tierSpecific.key,
			});
		}
	}

	for (const pair of viewablePairs) {
		await db.insert(announcementLikes).values({
			id: crypto.randomUUID(),
			announcementId: announcementIds[pair.announcementKey],
			userId: memberIds[pair.memberKey],
		});
	}

	const firstCommentByAnnouncement = new Map<
		string,
		{ commentId: string; memberKey: MemberKey }
	>();
	let hiddenCommentId: string | null = null;
	let commentCount = 0;

	function nextCommentBody(): string {
		const body = commentBodies[commentCount % commentBodies.length];
		return body ?? "Thanks for sharing!";
	}

	for (const pair of viewablePairs) {
		const announcementId = announcementIds[pair.announcementKey];
		const commentId = crypto.randomUUID();

		await db.insert(announcementComments).values({
			id: commentId,
			announcementId,
			userId: memberIds[pair.memberKey],
			body: nextCommentBody(),
		});
		commentCount += 1;

		const existing = firstCommentByAnnouncement.get(announcementId);
		if (!existing) {
			firstCommentByAnnouncement.set(announcementId, {
				commentId,
				memberKey: pair.memberKey,
			});
		} else if (hiddenCommentId === null) {
			hiddenCommentId = commentId;
		}
	}

	for (const pair of viewablePairs) {
		const announcementId = announcementIds[pair.announcementKey];
		const parent = firstCommentByAnnouncement.get(announcementId);
		if (parent && parent.memberKey !== pair.memberKey) {
			await db.insert(announcementComments).values({
				id: crypto.randomUUID(),
				announcementId,
				userId: memberIds[pair.memberKey],
				body: nextCommentBody(),
				parentCommentId: parent.commentId,
			});
			commentCount += 1;
		}
	}

	if (hiddenCommentId) {
		await db
			.update(announcementComments)
			.set({ status: "hidden" })
			.where(eq(announcementComments.id, hiddenCommentId));
	}
}
