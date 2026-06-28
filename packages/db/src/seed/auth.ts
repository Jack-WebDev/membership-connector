import { hashPassword } from "@better-auth/utils/password";
import { db } from "../client";
import { account, user } from "../schema/auth";
import { DEMO_PASSWORD, type UserDef } from "./data";

export async function seedAuthUsers<K extends string>(
	defs: Record<K, UserDef>,
): Promise<Record<K, string>> {
	const passwordHash = await hashPassword(DEMO_PASSWORD);
	const ids = {} as Record<K, string>;

	for (const key of Object.keys(defs) as K[]) {
		const def = defs[key];
		const userId = crypto.randomUUID();

		await db.insert(user).values({
			id: userId,
			name: def.name,
			email: def.email,
			emailVerified: true,
		});

		await db.insert(account).values({
			id: crypto.randomUUID(),
			accountId: userId,
			providerId: "credential",
			userId,
			password: passwordHash,
		});

		ids[key] = userId;
	}

	return ids;
}
