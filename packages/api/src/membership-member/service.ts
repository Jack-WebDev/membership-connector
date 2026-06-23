import { db } from "@membership-connector-app/db";
import { announcementComments } from "@membership-connector-app/db/schema/announcement";
import { financeTransactions } from "@membership-connector-app/db/schema/finance";
import {
	membershipApplications,
	membershipMembers,
	membershipTiers,
	savedMemberships,
} from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";

import { recordAuditLog } from "../audit-log/service";
import { createNotification } from "../notification/service";
import type {
	AdminMemberDetail,
	AdminMemberFilterOptions,
	AdminMemberSummary,
	ListAdminMembersInput,
	ListMemberMembershipsInput,
	MemberDashboardSummary,
	MemberMembershipDetail,
	MemberMembershipSummary,
} from "./types";

const PENDING_APPLICATION_STATUSES = [
	"submitted",
	"under_review",
	"needs_information",
] as const;

const MEMBER_STATUS_TRANSITIONS: Record<string, string[]> = {
	active: ["suspended", "cancelled"],
	pending_payment: ["cancelled"],
	suspended: ["active", "cancelled"],
	expired: [],
	cancelled: [],
};

async function findOwnedMembershipMemberOrThrow(
	userId: string,
	membershipId: string,
) {
	const row = await db.query.membershipMembers.findFirst({
		where: (table, { and, eq: equals }) =>
			and(
				equals(table.userId, userId),
				equals(table.membershipId, membershipId),
			),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
		orderBy: (table, { desc }) => desc(table.startedAt),
	});

	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Membership not found",
		});
	}

	return row;
}

type MembershipMemberWithRelations = Awaited<
	ReturnType<typeof findOwnedMembershipMemberOrThrow>
>;

function toSummary(
	row: MembershipMemberWithRelations,
): MemberMembershipSummary {
	return {
		id: row.id,
		status: row.status,
		membershipId: row.membershipId,
		membershipName: row.membership.name,
		membershipSlug: row.membership.slug,
		organizationName: row.membership.organization.name,
		organizationSlug: row.membership.organization.slug,
		tierName: row.membershipTier.name,
		startedAt: row.startedAt,
		expiresAt: row.expiresAt,
		cancelledAt: row.cancelledAt,
	};
}

function toDetail(row: MembershipMemberWithRelations): MemberMembershipDetail {
	return {
		...toSummary(row),
		membershipDescription: row.membership.description,
		tierPrice: row.membershipTier.price,
		tierCurrency: row.membershipTier.currency,
		tierBillingInterval: row.membershipTier.billingInterval,
		tierBenefits: row.membershipTier.benefits,
		tierRequirements: row.membershipTier.requirements,
		organizationEmail: row.membership.organization.email,
		organizationPhone: row.membership.organization.phone,
		organizationWebsiteUrl: row.membership.organization.websiteUrl,
	};
}

export async function listActiveMembershipsForUser(
	userId: string,
	input: ListMemberMembershipsInput,
): Promise<{ items: MemberMembershipSummary[]; total: number }> {
	const rows = await db.query.membershipMembers.findMany({
		where: eq(membershipMembers.userId, userId),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
	});

	const search = input.search?.trim().toLowerCase();

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter((row) => {
			if (!search) return true;

			const haystack = [
				row.membership.name,
				row.membership.organization.name,
				row.membershipTier.name,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(search);
		})
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "expiresAt") {
				const aTime = a.expiresAt?.getTime() ?? 0;
				const bTime = b.expiresAt?.getTime() ?? 0;
				return (aTime - bTime) * direction;
			}

			return (a.startedAt.getTime() - b.startedAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return { items: page.map(toSummary), total };
}

export async function getMembershipForUser(
	userId: string,
	membershipId: string,
): Promise<MemberMembershipDetail> {
	const row = await findOwnedMembershipMemberOrThrow(userId, membershipId);

	return toDetail(row);
}

export async function getMemberDashboardSummary(
	userId: string,
): Promise<MemberDashboardSummary> {
	const [members, applications, saved] = await Promise.all([
		db.query.membershipMembers.findMany({
			where: eq(membershipMembers.userId, userId),
			columns: { status: true },
		}),
		db.query.membershipApplications.findMany({
			where: eq(membershipApplications.userId, userId),
			columns: { status: true },
		}),
		db.query.savedMemberships.findMany({
			where: eq(savedMemberships.userId, userId),
			columns: { id: true },
		}),
	]);

	return {
		activeMemberships: members.filter((member) => member.status === "active")
			.length,
		pendingApplications: applications.filter((application) =>
			(PENDING_APPLICATION_STATUSES as readonly string[]).includes(
				application.status,
			),
		).length,
		approvedApplications: applications.filter(
			(application) => application.status === "approved",
		).length,
		rejectedApplications: applications.filter(
			(application) => application.status === "rejected",
		).length,
		savedMemberships: saved.length,
	};
}

async function findOrganizationMemberOrThrow(
	executor: DbExecutor,
	organizationId: string,
	memberId: string,
) {
	const row = await executor.query.membershipMembers.findFirst({
		where: and(
			eq(membershipMembers.id, memberId),
			eq(membershipMembers.organizationId, organizationId),
		),
		with: {
			membership: true,
			membershipTier: true,
			user: true,
		},
	});

	if (!row) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
	}

	return row;
}

type OrganizationMemberWithRelations = Awaited<
	ReturnType<typeof findOrganizationMemberOrThrow>
>;

function toAdminSummary(
	row: OrganizationMemberWithRelations,
): AdminMemberSummary {
	return {
		id: row.id,
		status: row.status,
		paymentStatus: row.status === "pending_payment" ? "pending" : "paid",
		userId: row.userId,
		userName: row.user.name,
		userEmail: row.user.email,
		membershipId: row.membershipId,
		membershipName: row.membership.name,
		membershipTierId: row.membershipTierId,
		tierName: row.membershipTier.name,
		startedAt: row.startedAt,
		expiresAt: row.expiresAt,
	};
}

export async function listMemberFilterOptions(
	organizationId: string,
): Promise<AdminMemberFilterOptions> {
	const orgMemberships = await db.query.memberships.findMany({
		where: (table, { eq: equals }) =>
			equals(table.organizationId, organizationId),
		columns: { id: true, name: true },
	});

	const orgTiers = await db.query.membershipTiers.findMany({
		where: inArray(
			membershipTiers.membershipId,
			orgMemberships.map((membership) => membership.id),
		),
		columns: { id: true, membershipId: true, name: true },
	});

	return {
		memberships: orgMemberships,
		tiers: orgTiers,
	};
}

export async function listOrganizationMembers(
	organizationId: string,
	input: ListAdminMembersInput,
): Promise<{ items: AdminMemberSummary[]; total: number }> {
	const rows = await db.query.membershipMembers.findMany({
		where: eq(membershipMembers.organizationId, organizationId),
		with: {
			membership: true,
			membershipTier: true,
			user: true,
		},
	});

	const search = input.search?.trim().toLowerCase();

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter(
			(row) => !input.membershipId || row.membershipId === input.membershipId,
		)
		.filter(
			(row) =>
				!input.membershipTierId ||
				row.membershipTierId === input.membershipTierId,
		)
		.filter((row) => {
			if (!input.paymentStatus) return true;
			const paymentStatus =
				row.status === "pending_payment" ? "pending" : "paid";
			return paymentStatus === input.paymentStatus;
		})
		.filter((row) => !input.joinedFrom || row.startedAt >= input.joinedFrom)
		.filter((row) => !input.joinedTo || row.startedAt <= input.joinedTo)
		.filter((row) => {
			if (!search) return true;

			const haystack = [row.user.name, row.user.email, row.membership.name]
				.join(" ")
				.toLowerCase();

			return haystack.includes(search);
		})
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "userName") {
				return a.user.name.localeCompare(b.user.name) * direction;
			}

			return (a.startedAt.getTime() - b.startedAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return {
		items: page.map(toAdminSummary),
		total,
	};
}

export async function getOrganizationMemberDetail(
	organizationId: string,
	memberId: string,
): Promise<AdminMemberDetail> {
	const member = await findOrganizationMemberOrThrow(
		db,
		organizationId,
		memberId,
	);

	const [applications, financeRecords, comments] = await Promise.all([
		db.query.membershipApplications.findMany({
			where: and(
				eq(membershipApplications.userId, member.userId),
				eq(membershipApplications.membershipId, member.membershipId),
			),
			columns: { id: true, status: true, submittedAt: true },
			orderBy: (table, { desc }) => desc(table.updatedAt),
		}),
		db.query.financeTransactions.findMany({
			where: and(
				eq(financeTransactions.userId, member.userId),
				eq(financeTransactions.organizationId, organizationId),
			),
			columns: {
				id: true,
				amount: true,
				currency: true,
				status: true,
				type: true,
				createdAt: true,
			},
			orderBy: (table, { desc }) => desc(table.createdAt),
			limit: 10,
		}),
		db.query.announcementComments.findMany({
			where: eq(announcementComments.userId, member.userId),
			columns: { id: true, body: true, createdAt: true },
			with: {
				announcement: { columns: { title: true, organizationId: true } },
			},
			orderBy: (table, { desc }) => desc(table.createdAt),
			limit: 10,
		}),
	]);

	return {
		...toAdminSummary(member),
		userImage: member.user.image,
		cancelledAt: member.cancelledAt,
		notes: member.notes,
		tierPrice: member.membershipTier.price,
		tierCurrency: member.membershipTier.currency,
		tierBillingInterval: member.membershipTier.billingInterval,
		applications,
		financeRecords,
		comments: comments
			.filter(
				(comment) => comment.announcement.organizationId === organizationId,
			)
			.map((comment) => ({
				id: comment.id,
				body: comment.body,
				createdAt: comment.createdAt,
				announcementTitle: comment.announcement.title,
			})),
	};
}

function memberStatusNotification(
	target: "active" | "suspended" | "cancelled",
	membershipName: string,
): { type: string; title: string; body: string } {
	if (target === "suspended") {
		return {
			type: "membership.suspended",
			title: "Membership suspended",
			body: `Your membership to ${membershipName} has been suspended. Contact the organization for details.`,
		};
	}

	if (target === "cancelled") {
		return {
			type: "membership.cancelled",
			title: "Membership cancelled",
			body: `Your membership to ${membershipName} has been cancelled.`,
		};
	}

	return {
		type: "membership.reactivated",
		title: "Membership reactivated",
		body: `Your membership to ${membershipName} has been reactivated.`,
	};
}

export async function updateMemberStatus(
	organizationId: string,
	userId: string,
	memberId: string,
	target: "active" | "suspended" | "cancelled",
): Promise<void> {
	await db.transaction(async (tx) => {
		const member = await findOrganizationMemberOrThrow(
			tx,
			organizationId,
			memberId,
		);

		const allowedTargets = MEMBER_STATUS_TRANSITIONS[member.status] ?? [];

		if (!allowedTargets.includes(target)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot move a member from "${member.status}" to "${target}"`,
			});
		}

		await tx
			.update(membershipMembers)
			.set({
				status: target,
				...(target === "cancelled" ? { cancelledAt: new Date() } : {}),
			})
			.where(eq(membershipMembers.id, memberId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: `member.${target}`,
			entityType: "membership_member",
			entityId: memberId,
			metadata: { from: member.status, to: target },
		});

		const notification = memberStatusNotification(
			target,
			member.membership.name,
		);

		await createNotification(tx, {
			userId: member.userId,
			type: notification.type,
			title: notification.title,
			body: notification.body,
			data: { membershipId: member.membershipId, memberId },
		});
	});
}

export async function changeMemberTier(
	organizationId: string,
	userId: string,
	memberId: string,
	membershipTierId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const member = await findOrganizationMemberOrThrow(
			tx,
			organizationId,
			memberId,
		);

		if (member.status === "expired" || member.status === "cancelled") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot change the tier of an expired or cancelled membership",
			});
		}

		const newTier = await tx.query.membershipTiers.findFirst({
			where: eq(membershipTiers.id, membershipTierId),
		});

		if (!newTier || newTier.membershipId !== member.membershipId) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
		}

		if (newTier.status !== "active") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This tier is not currently available",
			});
		}

		await tx
			.update(membershipMembers)
			.set({ membershipTierId })
			.where(eq(membershipMembers.id, memberId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "member.tier_changed",
			entityType: "membership_member",
			entityId: memberId,
			metadata: { from: member.membershipTierId, to: membershipTierId },
		});

		await createNotification(tx, {
			userId: member.userId,
			type: "membership.tier_changed",
			title: "Membership tier updated",
			body: `Your tier for ${member.membership.name} was changed to ${newTier.name}.`,
			data: { membershipId: member.membershipId, memberId },
		});
	});
}

export async function updateMemberNotes(
	organizationId: string,
	userId: string,
	memberId: string,
	notes: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		await findOrganizationMemberOrThrow(tx, organizationId, memberId);

		await tx
			.update(membershipMembers)
			.set({ notes: notes.length > 0 ? notes : null })
			.where(eq(membershipMembers.id, memberId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "member.notes_updated",
			entityType: "membership_member",
			entityId: memberId,
			metadata: {},
		});
	});
}
