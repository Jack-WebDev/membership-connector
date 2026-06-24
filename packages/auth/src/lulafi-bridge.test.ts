import { db } from "@membership-connector-app/db";
import { account, user } from "@membership-connector-app/db/schema/auth";
import { eq, inArray } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { resolveOrCreateLulafiApplicant } from "./lulafi-bridge";

const createdUserIds: string[] = [];

afterEach(async () => {
	if (createdUserIds.length === 0) {
		return;
	}

	await db.delete(account).where(inArray(account.userId, createdUserIds));
	await db.delete(user).where(inArray(user.id, createdUserIds));
	createdUserIds.length = 0;
});

describe("resolveOrCreateLulafiApplicant", () => {
	it("creates a new local user when no match exists", async () => {
		const email = `applicant-${crypto.randomUUID()}@example.test`;

		const created = await resolveOrCreateLulafiApplicant({
			sub: `lulafi-sub-${crypto.randomUUID()}`,
			email,
			name: "New Applicant",
		});
		createdUserIds.push(created.id);

		expect(created.email).toBe(email);
		expect(created.name).toBe("New Applicant");
		expect(created.emailVerified).toBe(false);

		const linkedAccount = await db.query.account.findFirst({
			where: eq(account.userId, created.id),
		});
		expect(linkedAccount?.providerId).toBe("lulafi");
	});

	it("returns the existing user when the LulaFi sub is already linked", async () => {
		const sub = `lulafi-sub-${crypto.randomUUID()}`;
		const email = `applicant-${crypto.randomUUID()}@example.test`;

		const first = await resolveOrCreateLulafiApplicant({
			sub,
			email,
			name: "Returning Applicant",
		});
		createdUserIds.push(first.id);

		const second = await resolveOrCreateLulafiApplicant({
			sub,
			email: "different-email@example.test",
			name: "Returning Applicant",
		});

		expect(second.id).toBe(first.id);
	});

	it("matches an existing user by email when there is no sub match", async () => {
		const email = `applicant-${crypto.randomUUID()}@example.test`;

		const first = await resolveOrCreateLulafiApplicant({
			email,
			name: "Email Match",
		});
		createdUserIds.push(first.id);

		const second = await resolveOrCreateLulafiApplicant({
			sub: `lulafi-sub-${crypto.randomUUID()}`,
			email,
			name: "Email Match",
		});

		expect(second.id).toBe(first.id);

		const linkedAccount = await db.query.account.findFirst({
			where: eq(account.userId, second.id),
		});
		expect(linkedAccount?.providerId).toBe("lulafi");
	});
});
