import { db } from "../client";
import { accountRoles, userProfiles } from "../schema/account";
import type { UserDef } from "./data";

export async function seedAccountRoles<K extends string>(
	userIds: Record<K, string>,
	role: "member" | "organization" | "platform_admin",
): Promise<void> {
	for (const userId of Object.values(userIds) as string[]) {
		await db.insert(accountRoles).values({
			id: crypto.randomUUID(),
			userId,
			role,
		});
	}
}

export async function seedUserProfiles<K extends string>(
	userIds: Record<K, string>,
	defs: Record<K, UserDef>,
): Promise<void> {
	for (const key of Object.keys(userIds) as K[]) {
		const userId = userIds[key];
		const [firstName, ...rest] = defs[key].name.split(" ");

		await db.insert(userProfiles).values({
			id: crypto.randomUUID(),
			userId,
			firstName,
			lastName: rest.join(" ") || null,
			phone: "+27821234567",
		});
	}
}
