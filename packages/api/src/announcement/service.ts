import { db } from "@membership-connector-app/db";
import { announcements } from "@membership-connector-app/db/schema/announcement";
import { membershipMembers } from "@membership-connector-app/db/schema/membership";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";

import type { MemberAnnouncementSummary } from "./types";

const ACTIVE_MEMBER_STATUSES = ["active", "pending_payment"] as const;
const VISIBLE_TO_MEMBERS = ["public", "members_only"] as const;

const VISIBILITY_LABELS: Record<string, string> = {
	public: "Public",
	members_only: "Members only",
};

type AnnouncementRow = {
	id: string;
	title: string;
	body: string;
	authorUser: { name: string };
	publishedAt: Date | null;
	pinned: boolean;
	visibility: string;
};

function toSummary(row: AnnouncementRow): MemberAnnouncementSummary {
	return {
		id: row.id,
		title: row.title,
		body: row.body,
		authorName: row.authorUser.name,
		publishedAt: row.publishedAt ?? new Date(0),
		pinned: row.pinned,
		visibilityLabel: VISIBILITY_LABELS[row.visibility] ?? row.visibility,
	};
}

async function assertActiveMembership(userId: string, membershipId: string) {
	const membership = await db.query.membershipMembers.findFirst({
		where: and(
			eq(membershipMembers.userId, userId),
			eq(membershipMembers.membershipId, membershipId),
			inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
		),
	});

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this membership's announcements",
		});
	}
}

export async function listVisibleAnnouncementsForMembershipMember(
	userId: string,
	membershipId: string,
): Promise<MemberAnnouncementSummary[]> {
	await assertActiveMembership(userId, membershipId);

	const rows = await db.query.announcements.findMany({
		where: and(
			eq(announcements.membershipId, membershipId),
			eq(announcements.status, "published"),
			inArray(announcements.visibility, VISIBLE_TO_MEMBERS),
		),
		with: { authorUser: true },
		orderBy: (table, { desc }) => [desc(table.pinned), desc(table.publishedAt)],
	});

	return rows.map(toSummary);
}

export async function listRecentAnnouncementsForUser(
	userId: string,
	limit = 5,
): Promise<MemberAnnouncementSummary[]> {
	const memberships = await db.query.membershipMembers.findMany({
		where: and(
			eq(membershipMembers.userId, userId),
			inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
		),
		columns: { membershipId: true },
	});

	const membershipIds = [
		...new Set(memberships.map((row) => row.membershipId)),
	];

	if (membershipIds.length === 0) {
		return [];
	}

	const rows = await db.query.announcements.findMany({
		where: and(
			inArray(announcements.membershipId, membershipIds),
			eq(announcements.status, "published"),
			inArray(announcements.visibility, VISIBLE_TO_MEMBERS),
		),
		with: { authorUser: true },
		orderBy: (table, { desc }) => desc(table.publishedAt),
	});

	return rows.slice(0, limit).map(toSummary);
}
