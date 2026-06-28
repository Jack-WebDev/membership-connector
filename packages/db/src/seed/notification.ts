import { db } from "../client";
import { notifications } from "../schema/notification";
import type { MemberKey } from "./data";

export async function seedNotifications(
	memberIds: Record<MemberKey, string>,
): Promise<void> {
	for (const userId of Object.values(memberIds) as string[]) {
		await db.insert(notifications).values([
			{
				id: crypto.randomUUID(),
				userId,
				type: "membership_application_approved",
				title: "Application approved",
				body: "Your membership application has been approved.",
				readAt: new Date(),
			},
			{
				id: crypto.randomUUID(),
				userId,
				type: "announcement_published",
				title: "New announcement",
				body: "There's a new announcement in one of your memberships.",
				readAt: null,
			},
		]);
	}
}
