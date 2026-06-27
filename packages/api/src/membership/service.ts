import { db } from "@membership-connector-app/db";
import {
	categories,
	memberships,
	membershipTiers,
	savedMemberships,
} from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";

import { recordAuditLog } from "../audit-log/service";
import {
	type ActiveTier,
	findStartingTier,
	membershipMatchesBillingInterval,
	membershipMatchesPricing,
	membershipMatchesSearch,
} from "./eligibility";
import type {
	AdminMembershipDetail,
	AdminMembershipStats,
	AdminMembershipSummary,
	CategoryOption,
	CreateMembershipInput,
	ListAdminMembershipsInput,
	ListPublicMembershipsInput,
	ListPublicMembershipsResult,
	PublicMembershipDetail,
	PublicMembershipSummary,
	UpdateMembershipInput,
} from "./types";

export {
	findStartingTier,
	membershipMatchesBillingInterval,
	membershipMatchesPricing,
	membershipMatchesSearch,
} from "./eligibility";

type MembershipWithRelations = {
	id: string;
	organizationId: string;
	name: string;
	slug: string;
	description: string | null;
	shortDescription: string | null;
	status: PublicMembershipSummary["status"];
	category: { id: string; slug: string; name: string };
	applicationRequired: boolean;
	createdAt: Date;
	organization: {
		id: string;
		slug: string;
		name: string;
		status: string;
	};
	tiers: ActiveTier[];
};

function toSummary(row: MembershipWithRelations): PublicMembershipSummary {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		shortDescription: row.shortDescription,
		category: row.category.name,
		categorySlug: row.category.slug,
		status: row.status,
		organizationId: row.organizationId,
		organizationName: row.organization.name,
		organizationSlug: row.organization.slug,
		activeTierCount: row.tiers.length,
		startingTier: findStartingTier(row.tiers),
	};
}

function toDetail(row: MembershipWithRelations): PublicMembershipDetail {
	return {
		...toSummary(row),
		description: row.description,
		applicationRequired: row.applicationRequired,
		tiers: [...row.tiers]
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((tier) => ({
				id: tier.id,
				name: tier.name,
				description: tier.description,
				price: tier.price,
				currency: tier.currency,
				billingInterval: tier.billingInterval,
				benefits: tier.benefits,
				requirements: tier.requirements,
			})),
	};
}

async function findEligiblePublishedMemberships(): Promise<
	MembershipWithRelations[]
> {
	const rows = await db.query.memberships.findMany({
		where: and(
			eq(memberships.status, "published"),
			eq(memberships.visibility, "public"),
		),
		with: {
			organization: true,
			category: true,
			tiers: {
				where: eq(membershipTiers.status, "active"),
			},
		},
	});

	return rows.filter((row) => row.organization.status === "active");
}

export async function listPublicMemberships(
	input: ListPublicMembershipsInput,
): Promise<ListPublicMembershipsResult> {
	const eligible = await findEligiblePublishedMemberships();

	const filtered = eligible
		.filter(
			(row) =>
				!input.organizationSlug ||
				row.organization.slug === input.organizationSlug,
		)
		.filter((row) => !input.category || row.category.slug === input.category)
		.filter((row) =>
			membershipMatchesBillingInterval(row.tiers, input.billingInterval),
		)
		.filter((row) => membershipMatchesPricing(row.tiers, input.pricing))
		.filter((row) =>
			membershipMatchesSearch(row, row.organization.name, input.search),
		);

	const sorted = filtered.sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);

	const total = sorted.length;
	const start = (input.page - 1) * input.pageSize;
	const items = sorted.slice(start, start + input.pageSize).map(toSummary);

	return { items, total };
}

export async function listPublicMembershipFilterOptions(): Promise<{
	categories: { slug: string; name: string }[];
	organizations: { slug: string; name: string }[];
}> {
	const [categoryRows, eligible] = await Promise.all([
		db.query.categories.findMany({
			orderBy: (table, { asc }) => asc(table.sortOrder),
		}),
		findEligiblePublishedMemberships(),
	]);

	const organizationsBySlug = new Map<string, { slug: string; name: string }>();
	for (const row of eligible) {
		organizationsBySlug.set(row.organization.slug, {
			slug: row.organization.slug,
			name: row.organization.name,
		});
	}

	return {
		categories: categoryRows.map((category) => ({
			slug: category.slug,
			name: category.name,
		})),
		organizations: Array.from(organizationsBySlug.values()).sort((a, b) =>
			a.name.localeCompare(b.name),
		),
	};
}

export async function getPublicMembershipBySlug(
	organizationSlug: string,
	membershipSlug: string,
): Promise<PublicMembershipDetail | null> {
	const row = await db.query.memberships.findFirst({
		where: and(
			eq(memberships.slug, membershipSlug),
			eq(memberships.status, "published"),
			eq(memberships.visibility, "public"),
		),
		with: {
			organization: true,
			category: true,
			tiers: {
				where: eq(membershipTiers.status, "active"),
			},
		},
	});

	if (
		row?.organization.status !== "active" ||
		row.organization.slug !== organizationSlug
	) {
		return null;
	}

	return toDetail(row);
}

export async function findPublicMembershipBySlug(
	membershipSlug: string,
): Promise<{ organizationSlug: string; membershipSlug: string } | null> {
	const row = await db.query.memberships.findFirst({
		where: and(
			eq(memberships.slug, membershipSlug),
			eq(memberships.status, "published"),
			eq(memberships.visibility, "public"),
		),
		with: {
			organization: true,
		},
	});

	if (row?.organization.status !== "active") {
		return null;
	}

	return { organizationSlug: row.organization.slug, membershipSlug: row.slug };
}

export async function toggleSavedMembership(
	userId: string,
	membershipId: string,
): Promise<{ saved: boolean }> {
	const existing = await db.query.savedMemberships.findFirst({
		where: and(
			eq(savedMemberships.userId, userId),
			eq(savedMemberships.membershipId, membershipId),
		),
	});

	if (existing) {
		await db
			.delete(savedMemberships)
			.where(eq(savedMemberships.id, existing.id));
		return { saved: false };
	}

	await db.insert(savedMemberships).values({
		id: crypto.randomUUID(),
		userId,
		membershipId,
	});

	return { saved: true };
}

export async function isMembershipSavedByUser(
	userId: string,
	membershipId: string,
): Promise<boolean> {
	const existing = await db.query.savedMemberships.findFirst({
		where: and(
			eq(savedMemberships.userId, userId),
			eq(savedMemberships.membershipId, membershipId),
		),
	});

	return existing != null;
}

export async function listSavedMembershipsForUser(
	userId: string,
): Promise<PublicMembershipSummary[]> {
	const rows = await db.query.savedMemberships.findMany({
		where: eq(savedMemberships.userId, userId),
		with: {
			membership: {
				with: {
					organization: true,
					category: true,
					tiers: { where: eq(membershipTiers.status, "active") },
				},
			},
		},
		orderBy: (table, { desc }) => desc(table.createdAt),
	});

	return rows
		.filter((row) => row.membership.organization.status === "active")
		.map((row) => toSummary(row.membership));
}

const MEMBERSHIP_STATUS_TRANSITIONS: Record<string, string[]> = {
	draft: ["published", "archived"],
	published: ["paused", "archived"],
	paused: ["published", "archived"],
	archived: [],
};

function toAdminTier(
	tier: typeof membershipTiers.$inferSelect,
): AdminMembershipDetail["tiers"][number] {
	return {
		id: tier.id,
		name: tier.name,
		description: tier.description,
		price: tier.price,
		currency: tier.currency,
		billingInterval: tier.billingInterval,
		benefits: tier.benefits,
		requirements: tier.requirements,
		maxMembers: tier.maxMembers,
		status: tier.status,
		sortOrder: tier.sortOrder,
	};
}

async function findOrganizationMembershipOrThrow(
	executor: DbExecutor,
	organizationId: string,
	membershipId: string,
) {
	const membership = await executor.query.memberships.findFirst({
		where: and(
			eq(memberships.id, membershipId),
			eq(memberships.organizationId, organizationId),
		),
		with: { category: true },
	});

	if (!membership) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Membership not found",
		});
	}

	return membership;
}

async function ensureMembershipSlugAvailable(
	executor: DbExecutor,
	organizationId: string,
	slug: string,
	excludeMembershipId?: string,
) {
	const existing = await executor.query.memberships.findFirst({
		where: and(
			eq(memberships.organizationId, organizationId),
			eq(memberships.slug, slug),
			...(excludeMembershipId ? [ne(memberships.id, excludeMembershipId)] : []),
		),
	});

	if (existing) {
		throw new TRPCError({
			code: "CONFLICT",
			message:
				"A membership with that slug already exists in this organization",
		});
	}
}

async function ensureCategoryExists(executor: DbExecutor, categoryId: string) {
	const category = await executor.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!category) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Select a valid category",
		});
	}
}

export async function createMembership(
	organizationId: string,
	userId: string,
	input: CreateMembershipInput,
): Promise<{ membershipId: string }> {
	const membershipId = crypto.randomUUID();

	await db.transaction(async (tx) => {
		await ensureMembershipSlugAvailable(tx, organizationId, input.slug);
		await ensureCategoryExists(tx, input.categoryId);

		await tx.insert(memberships).values({
			id: membershipId,
			organizationId,
			name: input.name,
			slug: input.slug,
			categoryId: input.categoryId,
			shortDescription: input.shortDescription ? input.shortDescription : null,
			description: input.description ? input.description : null,
			status: "draft",
			visibility: input.visibility,
			applicationRequired: input.applicationRequired,
			publicAnnouncementsEnabled: input.publicAnnouncementsEnabled,
			membersOnlyContentEnabled: input.membersOnlyContentEnabled,
		});

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "membership.created",
			entityType: "membership",
			entityId: membershipId,
			metadata: { name: input.name, slug: input.slug },
		});
	});

	return { membershipId };
}

export async function updateMembership(
	organizationId: string,
	userId: string,
	input: UpdateMembershipInput,
): Promise<void> {
	await db.transaction(async (tx) => {
		const membership = await findOrganizationMembershipOrThrow(
			tx,
			organizationId,
			input.membershipId,
		);

		if (membership.slug !== input.slug) {
			await ensureMembershipSlugAvailable(
				tx,
				organizationId,
				input.slug,
				input.membershipId,
			);
		}

		await ensureCategoryExists(tx, input.categoryId);

		await tx
			.update(memberships)
			.set({
				name: input.name,
				slug: input.slug,
				categoryId: input.categoryId,
				shortDescription: input.shortDescription
					? input.shortDescription
					: null,
				description: input.description ? input.description : null,
				visibility: input.visibility,
				applicationRequired: input.applicationRequired,
				publicAnnouncementsEnabled: input.publicAnnouncementsEnabled,
				membersOnlyContentEnabled: input.membersOnlyContentEnabled,
			})
			.where(eq(memberships.id, input.membershipId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "membership.updated",
			entityType: "membership",
			entityId: input.membershipId,
			metadata: { name: input.name, slug: input.slug },
		});
	});
}

export async function transitionMembershipStatus(
	organizationId: string,
	userId: string,
	membershipId: string,
	target: "published" | "paused" | "archived",
): Promise<void> {
	await db.transaction(async (tx) => {
		const membership = await findOrganizationMembershipOrThrow(
			tx,
			organizationId,
			membershipId,
		);

		const allowedTargets =
			MEMBERSHIP_STATUS_TRANSITIONS[membership.status] ?? [];

		if (!allowedTargets.includes(target)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot move a membership from "${membership.status}" to "${target}"`,
			});
		}

		await tx
			.update(memberships)
			.set({ status: target })
			.where(eq(memberships.id, membershipId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: `membership.${target}`,
			entityType: "membership",
			entityId: membershipId,
			metadata: { from: membership.status, to: target },
		});
	});
}

export async function listAdminMemberships(
	organizationId: string,
	input: ListAdminMembershipsInput,
): Promise<{ items: AdminMembershipSummary[]; total: number }> {
	const rows = await db.query.memberships.findMany({
		where: eq(memberships.organizationId, organizationId),
		with: { tiers: true, category: true },
	});

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter((row) => !input.visibility || row.visibility === input.visibility)
		.filter((row) => membershipMatchesSearch(row, "", input.search))
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "name") {
				return a.name.localeCompare(b.name) * direction;
			}

			return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return {
		items: page.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug,
			categoryId: row.categoryId,
			categoryName: row.category.name,
			shortDescription: row.shortDescription,
			status: row.status,
			visibility: row.visibility,
			tierCount: row.tiers.length,
			updatedAt: row.updatedAt,
		})),
		total,
	};
}

export async function getAdminMembershipStats(
	organizationId: string,
): Promise<AdminMembershipStats> {
	const rows = await db.query.memberships.findMany({
		where: eq(memberships.organizationId, organizationId),
		columns: { status: true },
	});

	const stats: AdminMembershipStats = {
		draft: 0,
		published: 0,
		paused: 0,
		archived: 0,
		total: rows.length,
	};

	for (const row of rows) {
		stats[row.status] += 1;
	}

	return stats;
}

export async function getAdminMembershipById(
	organizationId: string,
	membershipId: string,
): Promise<AdminMembershipDetail> {
	const membership = await findOrganizationMembershipOrThrow(
		db,
		organizationId,
		membershipId,
	);

	const tiers = await db.query.membershipTiers.findMany({
		where: eq(membershipTiers.membershipId, membershipId),
		orderBy: (table, { asc }) => asc(table.sortOrder),
	});

	return {
		id: membership.id,
		organizationId: membership.organizationId,
		name: membership.name,
		slug: membership.slug,
		categoryId: membership.categoryId,
		categoryName: membership.category.name,
		shortDescription: membership.shortDescription,
		description: membership.description,
		status: membership.status,
		visibility: membership.visibility,
		applicationRequired: membership.applicationRequired,
		publicAnnouncementsEnabled: membership.publicAnnouncementsEnabled,
		membersOnlyContentEnabled: membership.membersOnlyContentEnabled,
		createdAt: membership.createdAt,
		updatedAt: membership.updatedAt,
		tiers: tiers.map(toAdminTier),
	};
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
	const rows = await db.query.categories.findMany({
		orderBy: (table, { asc }) => asc(table.sortOrder),
	});

	return rows.map((row) => ({ id: row.id, slug: row.slug, name: row.name }));
}

export { ensureMembershipSlugAvailable, findOrganizationMembershipOrThrow };
