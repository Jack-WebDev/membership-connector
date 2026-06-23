import { z } from "zod";

export const notificationIdInput = z.object({
	notificationId: z.string().trim().min(1),
});
export type NotificationIdInput = z.infer<typeof notificationIdInput>;

export const listNotificationsInput = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListNotificationsInput = z.infer<typeof listNotificationsInput>;

export type MemberNotificationSummary = {
	id: string;
	type: string;
	title: string;
	body: string;
	data: Record<string, unknown>;
	readAt: Date | null;
	createdAt: Date;
};
