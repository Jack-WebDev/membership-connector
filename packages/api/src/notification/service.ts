import { db } from "@membership-connector-app/db";
import { notifications } from "@membership-connector-app/db/schema/notification";
import { organizationAdmins } from "@membership-connector-app/db/schema/organization";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";

import {
	hasOrganizationPermission,
	type OrganizationPermission,
} from "../permissions/permissions";
import type { MemberNotificationSummary } from "./types";

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

export async function listNotificationsForUser(
	userId: string,
	limit?: number,
): Promise<MemberNotificationSummary[]> {
	return db.query.notifications.findMany({
		where: eq(notifications.userId, userId),
		orderBy: (table, { desc }) => desc(table.createdAt),
		limit,
	});
}

export async function countUnreadNotificationsForUser(
	userId: string,
): Promise<number> {
	const rows = await db.query.notifications.findMany({
		where: and(eq(notifications.userId, userId), isNull(notifications.readAt)),
		columns: { id: true },
	});

	return rows.length;
}

export async function markNotificationAsRead(
	userId: string,
	notificationId: string,
): Promise<void> {
	const notification = await db.query.notifications.findFirst({
		where: and(
			eq(notifications.id, notificationId),
			eq(notifications.userId, userId),
		),
		columns: { id: true, readAt: true },
	});

	if (!notification) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Notification not found",
		});
	}

	if (notification.readAt) {
		return;
	}

	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(
	userId: string,
): Promise<void> {
	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
