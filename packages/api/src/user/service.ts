import { db } from "@membership-connector-app/db";
import { userProfiles } from "@membership-connector-app/db/schema/account";
import { eq } from "drizzle-orm";

import type { MyProfile, UpdateProfileInput } from "./types";

export async function getMyProfile(userId: string): Promise<MyProfile> {
	const profile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, userId),
	});

	return {
		firstName: profile?.firstName ?? "",
		lastName: profile?.lastName ?? "",
		phone: profile?.phone ?? "",
		bio: profile?.bio ?? "",
	};
}

export async function updateMyProfile(
	userId: string,
	input: UpdateProfileInput,
): Promise<void> {
	const values = {
		firstName: input.firstName ? input.firstName : null,
		lastName: input.lastName ? input.lastName : null,
		phone: input.phone ? input.phone : null,
		bio: input.bio ? input.bio : null,
	};

	await db
		.insert(userProfiles)
		.values({ id: crypto.randomUUID(), userId, ...values })
		.onConflictDoUpdate({
			target: userProfiles.userId,
			set: values,
		});
}
