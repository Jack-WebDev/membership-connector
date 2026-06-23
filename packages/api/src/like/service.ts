import { announcementLikes } from "@membership-connector-app/db/schema/announcement";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { and, eq } from "drizzle-orm";

export async function findAnnouncementLikeForUser(
	executor: DbExecutor,
	announcementId: string,
	userId: string,
) {
	return executor.query.announcementLikes.findFirst({
		where: and(
			eq(announcementLikes.announcementId, announcementId),
			eq(announcementLikes.userId, userId),
		),
	});
}

export async function addAnnouncementLike(
	executor: DbExecutor,
	announcementId: string,
	userId: string,
): Promise<void> {
	await executor.insert(announcementLikes).values({
		id: crypto.randomUUID(),
		announcementId,
		userId,
	});
}

export async function removeAnnouncementLike(
	executor: DbExecutor,
	likeId: string,
): Promise<void> {
	await executor
		.delete(announcementLikes)
		.where(eq(announcementLikes.id, likeId));
}
