import { db } from "@membership-connector-app/db";
import { accountRoles } from "@membership-connector-app/db/schema/account";
import {
	organizationAdmins,
	organizations,
} from "@membership-connector-app/db/schema/organization";
import { and, asc, eq } from "drizzle-orm";

export type AccountRole = typeof accountRoles.$inferSelect.role;
export type OrganizationAdminRole = typeof organizationAdmins.$inferSelect.role;

export async function listAccountRolesForUser(
	userId: string,
): Promise<AccountRole[]> {
	const rows = await db
		.select({ role: accountRoles.role })
		.from(accountRoles)
		.where(eq(accountRoles.userId, userId));

	return rows.map((row) => row.role);
}

export async function findAuthorizedOrganizationForUser(
	userId: string,
	orgSlug: string,
) {
	const [row] = await db
		.select({
			organizationId: organizations.id,
			slug: organizations.slug,
			name: organizations.name,
			role: organizationAdmins.role,
		})
		.from(organizationAdmins)
		.innerJoin(
			organizations,
			eq(organizationAdmins.organizationId, organizations.id),
		)
		.where(
			and(
				eq(organizationAdmins.userId, userId),
				eq(organizationAdmins.status, "active"),
				eq(organizations.slug, orgSlug),
			),
		)
		.limit(1);

	return row ?? null;
}

export async function findFirstAuthorizedOrganizationForUser(userId: string) {
	const [row] = await db
		.select({
			slug: organizations.slug,
		})
		.from(organizationAdmins)
		.innerJoin(
			organizations,
			eq(organizationAdmins.organizationId, organizations.id),
		)
		.where(
			and(
				eq(organizationAdmins.userId, userId),
				eq(organizationAdmins.status, "active"),
			),
		)
		.orderBy(asc(organizations.createdAt))
		.limit(1);

	return row ?? null;
}

export async function getAuthenticatedHomePath(userId: string) {
	const roles = await listAccountRolesForUser(userId);

	if (roles.includes("member")) {
		return "/member/dashboard";
	}

	if (roles.includes("organization")) {
		const organization = await findFirstAuthorizedOrganizationForUser(userId);

		return organization
			? `/org/${organization.slug}/dashboard`
			: "/onboarding/organization";
	}

	return "/onboarding/account-type";
}
