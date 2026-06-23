import { auditLogs } from "@membership-connector-app/db/schema/audit";
import type { DbExecutor } from "@membership-connector-app/db/types";

type RecordAuditLogInput = {
	organizationId: string;
	actorUserId: string | null;
	action: string;
	entityType: string;
	entityId: string;
	metadata?: Record<string, unknown>;
};

export async function recordAuditLog(
	executor: DbExecutor,
	input: RecordAuditLogInput,
): Promise<void> {
	await executor.insert(auditLogs).values({
		id: crypto.randomUUID(),
		organizationId: input.organizationId,
		actorUserId: input.actorUserId,
		action: input.action,
		entityType: input.entityType,
		entityId: input.entityId,
		metadata: input.metadata ?? {},
	});
}
