import { db } from "@membership-connector-app/db";
import {
	membershipApplications,
	membershipMembers,
	savedMemberships,
} from "@membership-connector-app/db/schema/membership";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import type {
	MemberDashboardSummary,
	MemberMembershipDetail,
	MemberMembershipSummary,
} from "./types";

const PENDING_APPLICATION_STATUSES = [
	"submitted",
	"under_review",
	"needs_information",
] as const;

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
): Promise<MemberMembershipSummary[]> {
	const rows = await db.query.membershipMembers.findMany({
		where: eq(membershipMembers.userId, userId),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
		orderBy: (table, { desc }) => desc(table.startedAt),
	});

	return rows.map(toSummary);
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
