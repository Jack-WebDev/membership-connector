import { db } from "@membership-connector-app/db";
import { announcementComments } from "@membership-connector-app/db/schema/announcement";
import { financeTransactions } from "@membership-connector-app/db/schema/finance";
import {
	membershipApplications,
	membershipMembers,
	memberships,
} from "@membership-connector-app/db/schema/membership";
import { organizations } from "@membership-connector-app/db/schema/organization";
import { and, eq, gte, inArray } from "drizzle-orm";

import { listPublicMemberships } from "../membership/service";
import type {
	OrganizationDashboardOverview,
	PublicOrganizationDetail,
	PublicOrganizationSummary,
} from "./types";

const PENDING_APPLICATION_STATUSES = [
	"submitted",
	"under_review",
	"needs_information",
] as const;

type OrganizationRow = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	websiteUrl: string | null;
	email: string | null;
	phone: string | null;
	createdAt: Date;
};

export function organizationMatchesSearch(
	organization: Pick<OrganizationRow, "name" | "description">,
	search: string | undefined,
): boolean {
	if (!search?.trim()) {
		return true;
	}

	const haystack = [organization.name, organization.description]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return haystack.includes(search.trim().toLowerCase());
}

async function countPublicMembershipsByOrganizationId(): Promise<
	Map<string, number>
> {
	const eligibleMemberships = await db.query.memberships.findMany({
		where: and(
			eq(memberships.status, "published"),
			eq(memberships.visibility, "public"),
		),
	});

	const countsByOrgId = new Map<string, number>();
	for (const membership of eligibleMemberships) {
		countsByOrgId.set(
			membership.organizationId,
			(countsByOrgId.get(membership.organizationId) ?? 0) + 1,
		);
	}

	return countsByOrgId;
}

export async function listPublicOrganizations(
	search?: string,
): Promise<PublicOrganizationSummary[]> {
	const activeOrganizations = await db.query.organizations.findMany({
		where: eq(organizations.status, "active"),
	});

	const countsByOrgId = await countPublicMembershipsByOrganizationId();

	return activeOrganizations
		.filter((organization) => organizationMatchesSearch(organization, search))
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.map((organization) => ({
			id: organization.id,
			slug: organization.slug,
			name: organization.name,
			description: organization.description,
			membershipCount: countsByOrgId.get(organization.id) ?? 0,
		}));
}

export async function getPublicOrganizationBySlug(
	slug: string,
): Promise<PublicOrganizationDetail | null> {
	const organization = await db.query.organizations.findFirst({
		where: and(
			eq(organizations.slug, slug),
			eq(organizations.status, "active"),
		),
	});

	if (!organization) {
		return null;
	}

	const orgMemberships = await listPublicMemberships({
		organizationSlug: slug,
		sort: "newest",
	});

	return {
		id: organization.id,
		slug: organization.slug,
		name: organization.name,
		description: organization.description,
		websiteUrl: organization.websiteUrl,
		email: organization.email,
		phone: organization.phone,
		membershipCount: orgMemberships.length,
		memberships: orgMemberships,
	};
}

function startOfCurrentMonth(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getOrganizationDashboardOverview(
	organizationId: string,
): Promise<OrganizationDashboardOverview> {
	const [
		membershipRows,
		applicationRows,
		memberRows,
		monthlyFinanceRows,
		orgAnnouncements,
		recentApplications,
		recentMembers,
		recentFinanceRecords,
	] = await Promise.all([
		db.query.memberships.findMany({
			where: eq(memberships.organizationId, organizationId),
			columns: { status: true },
		}),
		db.query.membershipApplications.findMany({
			where: eq(membershipApplications.organizationId, organizationId),
			columns: { status: true },
		}),
		db.query.membershipMembers.findMany({
			where: eq(membershipMembers.organizationId, organizationId),
			columns: { status: true },
		}),
		db.query.financeTransactions.findMany({
			where: and(
				eq(financeTransactions.organizationId, organizationId),
				eq(financeTransactions.status, "successful"),
				eq(financeTransactions.type, "membership_payment"),
				gte(financeTransactions.createdAt, startOfCurrentMonth()),
			),
			columns: { amount: true },
		}),
		db.query.announcements.findMany({
			where: (table, { eq: equals }) =>
				equals(table.organizationId, organizationId),
			columns: { id: true, title: true },
		}),
		db.query.membershipApplications.findMany({
			where: eq(membershipApplications.organizationId, organizationId),
			with: { membership: true, user: true },
			orderBy: (table, { desc }) => desc(table.updatedAt),
			limit: 5,
		}),
		db.query.membershipMembers.findMany({
			where: eq(membershipMembers.organizationId, organizationId),
			with: { membership: true, user: true },
			orderBy: (table, { desc }) => desc(table.startedAt),
			limit: 5,
		}),
		db.query.financeTransactions.findMany({
			where: eq(financeTransactions.organizationId, organizationId),
			columns: {
				id: true,
				amount: true,
				currency: true,
				status: true,
				type: true,
				createdAt: true,
			},
			orderBy: (table, { desc }) => desc(table.createdAt),
			limit: 5,
		}),
	]);

	const announcementTitlesById = new Map(
		orgAnnouncements.map((announcement) => [
			announcement.id,
			announcement.title,
		]),
	);

	const recentComments =
		orgAnnouncements.length > 0
			? await db.query.announcementComments.findMany({
					where: inArray(
						announcementComments.announcementId,
						orgAnnouncements.map((announcement) => announcement.id),
					),
					with: { user: true },
					orderBy: (table, { desc }) => desc(table.createdAt),
					limit: 5,
				})
			: [];

	const monthlyRevenue = monthlyFinanceRows
		.reduce((sum, row) => sum + Number(row.amount), 0)
		.toFixed(2);

	return {
		activeMembers: memberRows.filter((row) => row.status === "active").length,
		pendingApplications: applicationRows.filter((row) =>
			(PENDING_APPLICATION_STATUSES as readonly string[]).includes(row.status),
		).length,
		approvedApplications: applicationRows.filter(
			(row) => row.status === "approved",
		).length,
		rejectedApplications: applicationRows.filter(
			(row) => row.status === "rejected",
		).length,
		publishedMemberships: membershipRows.filter(
			(row) => row.status === "published",
		).length,
		pausedMemberships: membershipRows.filter((row) => row.status === "paused")
			.length,
		monthlyRevenue,
		currency: "ZAR",
		recentApplications: recentApplications.map((row) => ({
			id: row.id,
			applicantName: row.user.name,
			membershipName: row.membership.name,
			status: row.status,
			submittedAt: row.submittedAt,
		})),
		recentMembers: recentMembers.map((row) => ({
			id: row.id,
			userName: row.user.name,
			membershipName: row.membership.name,
			status: row.status,
			startedAt: row.startedAt,
		})),
		recentComments: recentComments.map((row) => ({
			id: row.id,
			userName: row.user.name,
			announcementTitle: announcementTitlesById.get(row.announcementId) ?? "—",
			body: row.body,
			createdAt: row.createdAt,
		})),
		recentFinanceRecords: recentFinanceRecords.map((row) => ({
			id: row.id,
			amount: row.amount,
			currency: row.currency,
			status: row.status,
			type: row.type,
			createdAt: row.createdAt,
		})),
	};
}
