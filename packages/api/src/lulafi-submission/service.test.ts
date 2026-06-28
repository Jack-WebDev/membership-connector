import type { ChatFormSubmissionMessage } from "@hubnet-systems/chat-sdk";
import { db } from "@membership-connector-app/db";
import { lulafiSubmissions } from "@membership-connector-app/db/schema/lulafi-submission";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import {
	cleanupTestData,
	createFixtureTracker,
	type FixtureTracker,
} from "../test-utils/db-fixtures";
import {
	insertLulafiSubmissionIfNew,
	normalizeSubmissionPayload,
	resolveFormMetadata,
} from "./service";

let tracker: FixtureTracker = createFixtureTracker();

function buildMessage(
	overrides: Partial<ChatFormSubmissionMessage> = {},
): ChatFormSubmissionMessage {
	return {
		id: crypto.randomUUID(),
		fromUserId: "provider-user",
		fromFullAddress: "i.provider-user.d.conn@api.dev.lulafi.co",
		fromDeviceId: "i.provider-user.d.conn@api.dev.lulafi.co",
		toDeviceId: "i.admin.d.server@api.dev.lulafi.co",
		roomId: "room-1",
		body: '{"hello":"world"}',
		timestamp: Date.now(),
		metadata: {
			messageType: "FORM_SUBMISSION",
		},
		answers: {},
		fields: [
			{
				id: "businessName",
				label: "Business Name",
				type: "text",
				required: true,
			},
		],
		payload: {
			readable: {
				businessName: {
					label: "Business Name",
					value: "LulaFi Test Provider",
				},
			},
			raw: {
				businessName: "LulaFi Test Provider",
			},
		},
		raw: {
			snapshot: true,
		},
		...overrides,
	};
}

afterEach(async () => {
	await cleanupTestData(tracker);
	tracker = createFixtureTracker();
});

describe("resolveFormMetadata", () => {
	it("prefers metadata.form when present", () => {
		const message = buildMessage({
			formId: "fallback-form",
			formVersion: 1,
			metadata: {
				messageType: "FORM_SUBMISSION",
				form: {
					id: "form-123",
					title: "Provider Intake",
					version: 3,
				},
			},
		});

		expect(resolveFormMetadata(message)).toEqual({
			id: "form-123",
			title: "Provider Intake",
			version: "3",
		});
	});

	it("falls back to top-level form fields", () => {
		const message = buildMessage({
			formId: "fallback-form",
			formVersion: 2,
		});

		expect(resolveFormMetadata(message)).toEqual({
			id: "fallback-form",
			title: "Business Name",
			version: "2",
		});
	});
});

describe("normalizeSubmissionPayload", () => {
	it("returns flattened readable fields when present", () => {
		const normalized = normalizeSubmissionPayload({
			readable: {
				businessName: {
					label: "Business Name",
					value: "LulaFi Test Provider",
				},
			},
		});

		expect(normalized).toEqual({
			source: "readable",
			fields: [
				{
					key: "businessName",
					label: "Business Name",
					value: "LulaFi Test Provider",
				},
			],
		});
	});

	it("falls back to the raw payload when no readable projection exists", () => {
		const payload = {
			raw: {
				businessName: "LulaFi Test Provider",
			},
		};

		expect(normalizeSubmissionPayload(payload)).toEqual(payload);
	});
});

describe("insertLulafiSubmissionIfNew", () => {
	it("inserts a new message and ignores duplicates", async () => {
		const message = buildMessage({
			id: "event-123",
			recordId: "record-123",
			providerDirectMessageRoomId: "provider-room-1",
		});

		const firstInsert = await insertLulafiSubmissionIfNew(message);
		expect(firstInsert.inserted).toBe(true);
		expect(firstInsert.submissionId).toBeTruthy();

		if (firstInsert.submissionId) {
			tracker.lulafiSubmissionIds.push(firstInsert.submissionId);
		}

		const secondInsert = await insertLulafiSubmissionIfNew(message);
		expect(secondInsert.inserted).toBe(false);
		expect(secondInsert.submissionId).toBeNull();

		const rows = await db
			.select()
			.from(lulafiSubmissions)
			.where(eq(lulafiSubmissions.externalEventId, "event-123"));

		expect(rows).toHaveLength(1);
		expect(rows[0]?.recordId).toBe("record-123");
		expect(rows[0]?.providerDirectMessageRoomId).toBe("provider-room-1");
	});
});
