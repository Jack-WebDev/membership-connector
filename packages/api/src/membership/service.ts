import { db } from "@membership-connector-app/db";
import {
	memberships,
	membershipTiers,
	savedMemberships,
} from "@membership-connector-app/db/schema/membership";
import { and, eq } from "drizzle-orm";

import {
	type ActiveTier,
	findStartingTier,
	membershipMatchesBillingInterval,
	membershipMatchesPricing,
	membershipMatchesSearch,
} from "./eligibility";
import type {
	ListPublicMembershipsInput,
	PublicMembershipDetail,
	PublicMembershipSummary,
} from "./types";

export {
	findStartingTier,
	membershipMatchesBillingInterval,
	membershipMatchesPricing,
	membershipMatchesSearch,
} from "./eligibility";

const DEFAULT_CATEGORY = "General";

type MembershipWithRelations = {
	id: string;
	organizationId: string;
	name: string;
	slug: string;
	description: string | null;
	shortDescription: string | null;
	status: PublicMembershipSummary["status"];
	category: string | null;
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
		category: row.category ?? DEFAULT_CATEGORY,
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
			tiers: {
				where: eq(membershipTiers.status, "active"),
			},
		},
	});

	return rows.filter((row) => row.organization.status === "active");
}

export async function listPublicMemberships(
	input: ListPublicMembershipsInput,
): Promise<PublicMembershipSummary[]> {
	const eligible = await findEligiblePublishedMemberships();

	const filtered = eligible
		.filter(
			(row) =>
				!input.organizationSlug ||
				row.organization.slug === input.organizationSlug,
		)
		.filter(
			(row) =>
				!input.category ||
				(row.category ?? DEFAULT_CATEGORY) === input.category,
		)
		.filter((row) =>
			membershipMatchesBillingInterval(row.tiers, input.billingInterval),
		)
		.filter((row) => membershipMatchesPricing(row.tiers, input.pricing))
		.filter((row) =>
			membershipMatchesSearch(row, row.organization.name, input.search),
		);

	return filtered
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.map(toSummary);
}

export async function listPublicMembershipFilterOptions(): Promise<{
	categories: string[];
	organizations: { slug: string; name: string }[];
}> {
	const eligible = await findEligiblePublishedMemberships();

	const categories = Array.from(
		new Set(eligible.map((row) => row.category ?? DEFAULT_CATEGORY)),
	).sort();

	const organizationsBySlug = new Map<string, { slug: string; name: string }>();
	for (const row of eligible) {
		organizationsBySlug.set(row.organization.slug, {
			slug: row.organization.slug,
			name: row.organization.name,
		});
	}

	return {
		categories,
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
