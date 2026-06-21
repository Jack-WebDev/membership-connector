import { db } from "@membership-connector-app/db";
import { memberships } from "@membership-connector-app/db/schema/membership";
import { organizations } from "@membership-connector-app/db/schema/organization";
import { and, eq } from "drizzle-orm";

import { listPublicMemberships } from "../membership/service";
import type {
	PublicOrganizationDetail,
	PublicOrganizationSummary,
} from "./types";

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
