import {
	cleanupTestData,
	createFixtureTracker,
	createTestMembership,
	createTestOrganization,
	createTestTier,
	createTestUser,
	type FixtureTracker,
} from "@membership-connector-app/api/test-utils/db-fixtures";
import { db } from "@membership-connector-app/db";
import { account } from "@membership-connector-app/db/schema/auth";
import { lulafiInboxMessages } from "@membership-connector-app/db/schema/lulafi-inbox";
import { eq, inArray } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import type { LulafiFormSubmissionPayload } from "./client";
import { processLulafiFormSubmission } from "./pipeline";

type TestSubmission = LulafiFormSubmissionPayload & { correlationId: string };

let tracker: FixtureTracker = createFixtureTracker();
const trackedExternalIds: string[] = [];
const trackedApplicationOwnerIds: string[] = [];

afterEach(async () => {
	if (trackedExternalIds.length > 0) {
		await db
			.delete(lulafiInboxMessages)
			.where(inArray(lulafiInboxMessages.externalId, trackedExternalIds));
		trackedExternalIds.length = 0;
	}

	if (trackedApplicationOwnerIds.length > 0) {
		await db
			.delete(account)
			.where(inArray(account.userId, trackedApplicationOwnerIds));
		tracker.userIds.push(...trackedApplicationOwnerIds);
		trackedApplicationOwnerIds.length = 0;
	}

	await cleanupTestData(tracker);
	tracker = createFixtureTracker();
});

function formSubmission(
	overrides: Partial<LulafiFormSubmissionPayload> = {},
): TestSubmission {
	const correlationId = overrides.correlationId ?? crypto.randomUUID();
	trackedExternalIds.push(correlationId);

	return {
		id: crypto.randomUUID(),
		fromUserId: `lulafi-user-${crypto.randomUUID()}`,
		displayName: "Test Applicant",
		timestamp: Date.now(),
		answers: {
			email: `applicant-${crypto.randomUUID()}@example.test`,
			name: "Test Applicant",
			reason: "I want to join.",
		},
		fields: [
			{ id: "email", label: "Email Address", type: "email", required: true },
			{ id: "name", label: "Full Name", type: "text", required: true },
			{ id: "reason", label: "Reason", type: "text", required: false },
		],
		payload: {},
		...overrides,
		correlationId,
	};
}

async function setUpOrgMembershipTier() {
	const ownerUserId = await createTestUser(tracker);
	const { organizationId } = await createTestOrganization(tracker, ownerUserId);
	const membershipId = await createTestMembership(tracker, organizationId);
	const tierId = await createTestTier(tracker, membershipId);
	return { membershipId, tierId };
}

async function findInboxRow(externalId: string) {
	return db.query.lulafiInboxMessages.findFirst({
		where: eq(lulafiInboxMessages.externalId, externalId),
	});
}

async function trackApplicationOwner(applicationId: string) {
	const application = await db.query.membershipApplications.findFirst({
		where: (table, { eq: eqOp }) => eqOp(table.id, applicationId),
	});

	if (application) {
		trackedApplicationOwnerIds.push(application.userId);
	}

	return application;
}

describe("processLulafiFormSubmission", () => {
	it("creates a submitted application for a brand-new applicant", async () => {
		const { membershipId, tierId } = await setUpOrgMembershipTier();
		const message = formSubmission();
		const target = { defaultMembershipId: membershipId, defaultTierId: tierId };

		await processLulafiFormSubmission(message, message.correlationId, target);

		const inboxRow = await findInboxRow(message.correlationId);
		expect(inboxRow?.processingStatus).toBe("processed");
		expect(inboxRow?.organizationId).toBeTruthy();

		const application = inboxRow?.createdApplicationId
			? await trackApplicationOwner(inboxRow.createdApplicationId)
			: undefined;
		expect(application?.status).toBe("submitted");
	});

	it("is idempotent for the same externalId", async () => {
		const { membershipId, tierId } = await setUpOrgMembershipTier();
		const message = formSubmission();
		const target = { defaultMembershipId: membershipId, defaultTierId: tierId };

		await processLulafiFormSubmission(message, message.correlationId, target);
		await processLulafiFormSubmission(message, message.correlationId, target);

		const rows = await db.query.lulafiInboxMessages.findMany({
			where: eq(lulafiInboxMessages.externalId, message.correlationId),
		});
		expect(rows).toHaveLength(1);

		if (rows[0]?.createdApplicationId) {
			await trackApplicationOwner(rows[0].createdApplicationId);
		}
	});

	it("marks the row unmatched when the payload can't be mapped", async () => {
		const { membershipId, tierId } = await setUpOrgMembershipTier();
		const message = formSubmission({ answers: {}, fields: [] });
		const target = { defaultMembershipId: membershipId, defaultTierId: tierId };

		await processLulafiFormSubmission(message, message.correlationId, target);

		const inboxRow = await findInboxRow(message.correlationId);
		expect(inboxRow?.processingStatus).toBe("unmatched");
		expect(inboxRow?.errorMessage).toMatch(/email/i);
	});

	it("marks the row failed when submitApplication rejects it", async () => {
		const { membershipId, tierId } = await setUpOrgMembershipTier();
		const email = `applicant-${crypto.randomUUID()}@example.test`;
		const target = { defaultMembershipId: membershipId, defaultTierId: tierId };

		const first = formSubmission({ answers: { email, name: "Dup Applicant" } });
		await processLulafiFormSubmission(first, first.correlationId, target);

		const second = formSubmission({
			answers: { email, name: "Dup Applicant" },
		});
		await processLulafiFormSubmission(second, second.correlationId, target);

		const secondInboxRow = await findInboxRow(second.correlationId);
		expect(secondInboxRow?.processingStatus).toBe("failed");
		expect(secondInboxRow?.errorMessage).toMatch(/active application/i);

		const firstInboxRow = await findInboxRow(first.correlationId);
		if (firstInboxRow?.createdApplicationId) {
			await trackApplicationOwner(firstInboxRow.createdApplicationId);
		}
	});
});
