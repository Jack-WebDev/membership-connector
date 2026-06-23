import { z } from "zod";

export const notificationIdInput = z.object({
	notificationId: z.string().trim().min(1),
});
export type NotificationIdInput = z.infer<typeof notificationIdInput>;

export const listNotificationsInput = z.object({
	search: z.string().trim().max(160).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
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

export type MemberNotificationListResult = {
	items: MemberNotificationSummary[];
	total: number;
};
