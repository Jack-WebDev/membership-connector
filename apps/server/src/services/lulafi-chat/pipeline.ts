import { submitApplication } from "@membership-connector-app/api/membership-application/service";
import { resolveOrCreateLulafiApplicant } from "@membership-connector-app/auth/lulafi-bridge";
import { db } from "@membership-connector-app/db";
import { lulafiInboxMessages } from "@membership-connector-app/db/schema/lulafi-inbox";
import { memberships } from "@membership-connector-app/db/schema/membership";
import { logError, logInfo } from "@membership-connector-app/observability";
import { eq } from "drizzle-orm";

import type { LulafiFormSubmissionPayload } from "./client";
import { LulafiMappingError, mapLulafiFormSubmission } from "./mapper";

async function resolveDefaultOrganizationId(
	membershipId: string,
): Promise<string> {
	const membership = await db.query.memberships.findFirst({
		where: eq(memberships.id, membershipId),
		columns: { organizationId: true },
	});

	if (!membership) {
		throw new Error(
			`LULA_CHAT_DEFAULT_MEMBERSHIP_ID (${membershipId}) does not match any membership`,
		);
	}

	return membership.organizationId;
}

function errorToMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export async function processLulafiFormSubmission(
	rawPayload: LulafiFormSubmissionPayload,
	externalId: string,
	target: { defaultMembershipId: string; defaultTierId: string },
): Promise<void> {
	const inserted = await db
		.insert(lulafiInboxMessages)
		.values({
			id: crypto.randomUUID(),
			externalId,
			rawPayload,
		})
		.onConflictDoNothing()
		.returning({ id: lulafiInboxMessages.id });

	const inboxId = inserted[0]?.id;
	if (!inboxId) {
		logInfo("lulafi.inbox.duplicate_skipped", { externalId });
		return;
	}

	try {
		const organizationId = await resolveDefaultOrganizationId(
			target.defaultMembershipId,
		);

		await db
			.update(lulafiInboxMessages)
			.set({ organizationId })
			.where(eq(lulafiInboxMessages.id, inboxId));

		const mapped = mapLulafiFormSubmission(rawPayload);

		const user = await resolveOrCreateLulafiApplicant({
			sub: mapped.lulafiSub,
			email: mapped.applicantEmail,
			name: mapped.applicantName,
		});

		const { applicationId } = await submitApplication(user.id, {
			membershipId: target.defaultMembershipId,
			membershipTierId: target.defaultTierId,
			answers: mapped.answers,
		});

		await db
			.update(lulafiInboxMessages)
			.set({
				processingStatus: "processed",
				createdApplicationId: applicationId,
				processedAt: new Date(),
			})
			.where(eq(lulafiInboxMessages.id, inboxId));

		logInfo("lulafi.inbox.processed", { externalId, applicationId });
	} catch (error) {
		const status = error instanceof LulafiMappingError ? "unmatched" : "failed";

		await db
			.update(lulafiInboxMessages)
			.set({
				processingStatus: status,
				errorMessage: errorToMessage(error),
				processedAt: new Date(),
			})
			.where(eq(lulafiInboxMessages.id, inboxId));

		logError("lulafi.inbox.process_failed", {
			err: error,
			externalId,
			errorCode: "LULAFI_INBOX_PROCESS_FAILED",
		});
	}
}
