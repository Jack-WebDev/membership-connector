import { db } from "../client";
import { organizationAdmins, organizations } from "../schema/organization";
import { type AdminKey, adminDefs, type OrgKey, orgDefs } from "./data";

export async function seedOrganizations(
	ownerIds: Record<OrgKey, string>,
): Promise<Record<OrgKey, string>> {
	const orgIds = {} as Record<OrgKey, string>;

	for (const orgKey of Object.keys(orgDefs) as OrgKey[]) {
		const def = orgDefs[orgKey];
		const organizationId = crypto.randomUUID();

		await db.insert(organizations).values({
			id: organizationId,
			name: def.name,
			slug: def.slug,
			description: def.description,
			email: def.email,
			phone: def.phone,
			websiteUrl: def.websiteUrl,
			status: "active",
			createdByUserId: ownerIds[orgKey],
		});

		await db.insert(organizationAdmins).values({
			id: crypto.randomUUID(),
			organizationId,
			userId: ownerIds[orgKey],
			role: "owner",
			status: "active",
		});

		orgIds[orgKey] = organizationId;
	}

	return orgIds;
}

export async function seedOrganizationAdmins(
	orgIds: Record<OrgKey, string>,
	ownerIds: Record<OrgKey, string>,
	adminIds: Record<AdminKey, string>,
): Promise<void> {
	for (const adminKey of Object.keys(adminDefs) as AdminKey[]) {
		const def = adminDefs[adminKey];

		await db.insert(organizationAdmins).values({
			id: crypto.randomUUID(),
			organizationId: orgIds[def.orgKey],
			userId: adminIds[adminKey],
			role: def.role,
			status: "active",
			invitedByUserId: ownerIds[def.orgKey],
		});
	}
}
