import { notifications } from "@membership-connector-app/db/schema/notification";
import { organizationAdmins } from "@membership-connector-app/db/schema/organization";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { and, eq } from "drizzle-orm";

import {
	hasOrganizationPermission,
	type OrganizationPermission,
} from "../permissions/permissions";

type NotificationInput = {
	userId: string;
	type: string;
	title: string;
	body: string;
	data?: Record<string, unknown>;
};

export async function createNotification(
	executor: DbExecutor,
	input: NotificationInput,
): Promise<void> {
	await executor.insert(notifications).values({
		id: crypto.randomUUID(),
		userId: input.userId,
		type: input.type,
		title: input.title,
		body: input.body,
		data: input.data ?? {},
	});
}

export async function notifyOrganizationAdmins(
	executor: DbExecutor,
	organizationId: string,
	permission: OrganizationPermission,
	input: Omit<NotificationInput, "userId">,
): Promise<void> {
	const admins = await executor
		.select({
			userId: organizationAdmins.userId,
			role: organizationAdmins.role,
		})
		.from(organizationAdmins)
		.where(
			and(
				eq(organizationAdmins.organizationId, organizationId),
				eq(organizationAdmins.status, "active"),
			),
		);

	const recipients = admins.filter((admin) =>
		hasOrganizationPermission(admin.role, permission),
	);

	for (const recipient of recipients) {
		await createNotification(executor, { ...input, userId: recipient.userId });
	}
}
