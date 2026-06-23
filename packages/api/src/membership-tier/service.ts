import { db } from "@membership-connector-app/db";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import { membershipTiers } from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { findOrganizationMembershipOrThrow } from "../membership/service";
import type {
	AdminTierDetail,
	AdminTierStats,
	AdminTierSummary,
	CreateTierInput,
	ListAdminTiersInput,
	UpdateTierInput,
} from "./types";

function ensurePriceMatchesBillingInterval(
	billingInterval: string,
	price: number,
) {
	if (billingInterval === "free" && price !== 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Free tiers must have a price of 0",
		});
	}
}

async function findOrganizationTierOrThrow(
	executor: DbExecutor,
	organizationId: string,
	tierId: string,
) {
	const tier = await executor.query.membershipTiers.findFirst({
		where: eq(membershipTiers.id, tierId),
		with: { membership: true },
	});

	if (!tier || tier.membership.organizationId !== organizationId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
	}

	return tier;
}

function toSummary(
	tier: Awaited<ReturnType<typeof findOrganizationTierOrThrow>>,
): AdminTierSummary {
	return {
		id: tier.id,
		name: tier.name,
		membershipId: tier.membershipId,
		membershipName: tier.membership.name,
		price: tier.price,
		currency: tier.currency,
		billingInterval: tier.billingInterval,
		status: tier.status,
		maxMembers: tier.maxMembers,
		sortOrder: tier.sortOrder,
		updatedAt: tier.updatedAt,
	};
}

function toDetail(
	tier: Awaited<ReturnType<typeof findOrganizationTierOrThrow>>,
): AdminTierDetail {
	return {
		id: tier.id,
		membershipId: tier.membershipId,
		membershipName: tier.membership.name,
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
		createdAt: tier.createdAt,
		updatedAt: tier.updatedAt,
	};
}

export async function createMembershipTier(
	organizationId: string,
	userId: string,
	input: CreateTierInput,
): Promise<{ tierId: string }> {
	ensurePriceMatchesBillingInterval(input.billingInterval, input.price);

	const tierId = crypto.randomUUID();

	await db.transaction(async (tx) => {
		await findOrganizationMembershipOrThrow(
			tx,
			organizationId,
			input.membershipId,
		);

		const existingTiers = await tx.query.membershipTiers.findMany({
			where: eq(membershipTiers.membershipId, input.membershipId),
			columns: { sortOrder: true },
		});
		const nextSortOrder =
			existingTiers.length === 0
				? 0
				: Math.max(...existingTiers.map((tier) => tier.sortOrder)) + 1;

		await tx.insert(membershipTiers).values({
			id: tierId,
			membershipId: input.membershipId,
			name: input.name,
			description: input.description ? input.description : null,
			price: input.price.toFixed(2),
			currency: input.currency,
			billingInterval: input.billingInterval,
			benefits: input.benefits,
			requirements: input.requirements,
			maxMembers: input.maxMembers ?? null,
			status: input.status,
			sortOrder: nextSortOrder,
		});

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: "membership_tier.created",
			entityType: "membership_tier",
			entityId: tierId,
			metadata: { name: input.name, membershipId: input.membershipId },
		});
	});

	return { tierId };
}

export async function updateMembershipTier(
	organizationId: string,
	userId: string,
	input: UpdateTierInput,
): Promise<void> {
	ensurePriceMatchesBillingInterval(input.billingInterval, input.price);

	await db.transaction(async (tx) => {
		const tier = await findOrganizationTierOrThrow(
			tx,
			organizationId,
			input.tierId,
		);

		if (tier.status === "archived") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Archived tiers cannot be edited",
			});
		}

		await tx
			.update(membershipTiers)
			.set({
				name: input.name,
				description: input.description ? input.description : null,
				price: input.price.toFixed(2),
				currency: input.currency,
				billingInterval: input.billingInterval,
				benefits: input.benefits,
				requirements: input.requirements,
				maxMembers: input.maxMembers ?? null,
				status: input.status,
				sortOrder: input.sortOrder ?? tier.sortOrder,
			})
			.where(eq(membershipTiers.id, input.tierId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: "membership_tier.updated",
			entityType: "membership_tier",
			entityId: input.tierId,
			metadata: { name: input.name },
		});
	});
}

export async function toggleMembershipTierActive(
	organizationId: string,
	userId: string,
	tierId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const tier = await findOrganizationTierOrThrow(tx, organizationId, tierId);

		if (tier.status === "archived") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Archived tiers cannot be activated or deactivated",
			});
		}

		const nextStatus = tier.status === "active" ? "inactive" : "active";

		await tx
			.update(membershipTiers)
			.set({ status: nextStatus })
			.where(eq(membershipTiers.id, tierId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: `membership_tier.${nextStatus}`,
			entityType: "membership_tier",
			entityId: tierId,
			metadata: { from: tier.status, to: nextStatus },
		});
	});
}

export async function archiveMembershipTier(
	organizationId: string,
	userId: string,
	tierId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const tier = await findOrganizationTierOrThrow(tx, organizationId, tierId);

		if (tier.status === "archived") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This tier is already archived",
			});
		}

		await tx
			.update(membershipTiers)
			.set({ status: "archived" })
			.where(eq(membershipTiers.id, tierId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId: userId,
			action: "membership_tier.archived",
			entityType: "membership_tier",
			entityId: tierId,
			metadata: { from: tier.status },
		});
	});
}

export async function listAdminMembershipTiers(
	organizationId: string,
	input: ListAdminTiersInput,
): Promise<{ items: AdminTierSummary[]; total: number }> {
	const rows = await db.query.membershipTiers.findMany({
		with: { membership: true },
	});

	const search = input.search?.trim().toLowerCase();

	const filtered = rows
		.filter((row) => row.membership.organizationId === organizationId)
		.filter(
			(row) => !input.membershipId || row.membershipId === input.membershipId,
		)
		.filter((row) => !input.status || row.status === input.status)
		.filter(
			(row) =>
				!search ||
				row.name.toLowerCase().includes(search) ||
				row.membership.name.toLowerCase().includes(search),
		)
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "name") {
				return a.name.localeCompare(b.name) * direction;
			}

			if (input.sortBy === "price") {
				return (Number(a.price) - Number(b.price)) * direction;
			}

			return (a.sortOrder - b.sortOrder) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return { items: page.map(toSummary), total };
}

export async function getAdminTierStats(
	organizationId: string,
): Promise<AdminTierStats> {
	const rows = await db.query.membershipTiers.findMany({
		with: { membership: true },
		columns: { status: true, membershipId: true },
	});

	const orgRows = rows.filter(
		(row) => row.membership.organizationId === organizationId,
	);

	const stats: AdminTierStats = {
		active: 0,
		inactive: 0,
		archived: 0,
		total: orgRows.length,
	};
	for (const row of orgRows) {
		stats[row.status] += 1;
	}

	return stats;
}

export async function getAdminMembershipTierById(
	organizationId: string,
	tierId: string,
): Promise<AdminTierDetail> {
	const tier = await findOrganizationTierOrThrow(db, organizationId, tierId);
	return toDetail(tier);
}

export async function listActiveTierMembershipOptions(
	organizationId: string,
): Promise<{ id: string; name: string }[]> {
	const rows = await db.query.memberships.findMany({
		where: (table, { eq: equals, ne: notEqual, and: combine }) =>
			combine(
				equals(table.organizationId, organizationId),
				notEqual(table.status, "archived"),
			),
		columns: { id: true, name: true },
	});

	return rows.map((row) => ({ id: row.id, name: row.name }));
}
