import { db } from "../client";
import { auditLogs } from "../schema/audit";
import { type OrgKey, orgDefs } from "./data";

export async function seedAuditLogs(
	orgIds: Record<OrgKey, string>,
	ownerIds: Record<OrgKey, string>,
): Promise<void> {
	for (const orgKey of Object.keys(orgDefs) as OrgKey[]) {
		const organizationId = orgIds[orgKey];
		const actorUserId = ownerIds[orgKey];

		await db.insert(auditLogs).values([
			{
				id: crypto.randomUUID(),
				organizationId,
				actorUserId,
				action: "organization.onboarded",
				entityType: "organization",
				entityId: organizationId,
				metadata: { source: "seed" },
			},
			{
				id: crypto.randomUUID(),
				organizationId,
				actorUserId,
				action: "organization.settings_updated",
				entityType: "organization",
				entityId: organizationId,
				metadata: { source: "seed" },
			},
		]);
	}
}
