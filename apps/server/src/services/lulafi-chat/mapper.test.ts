import { describe, expect, it } from "vitest";

import type { LulafiFormSubmissionPayload } from "./client";
import { LulafiMappingError, mapLulafiFormSubmission } from "./mapper";

function payload(
	overrides: Partial<LulafiFormSubmissionPayload> = {},
): LulafiFormSubmissionPayload {
	return {
		id: "msg-1",
		correlationId: "corr-1",
		fromUserId: "lulafi-user-1",
		displayName: "Jane Applicant",
		timestamp: Date.now(),
		answers: {
			email: "jane@example.com",
			name: "Jane Applicant",
			phone: "555-0100",
			reason: "I want to join the community.",
		},
		fields: [
			{ id: "email", label: "Email Address", type: "email", required: true },
			{ id: "name", label: "Full Name", type: "text", required: true },
			{ id: "phone", label: "Phone Number", type: "text", required: false },
			{
				id: "reason",
				label: "Why do you want to join?",
				type: "text",
				required: false,
			},
		],
		payload: {},
		...overrides,
	};
}

describe("mapLulafiFormSubmission", () => {
	it("maps a well-formed submission to applicant fields and answers", () => {
		const result = mapLulafiFormSubmission(payload());

		expect(result.applicantEmail).toBe("jane@example.com");
		expect(result.applicantName).toBe("Jane Applicant");
		expect(result.applicantPhone).toBe("555-0100");
		expect(result.lulafiSub).toBe("lulafi-user-1");
		expect(result.answers.reason).toBe("I want to join the community.");
		expect(result.answers.agreement).toBe(true);
	});

	it("falls back to displayName when no name field is present", () => {
		const result = mapLulafiFormSubmission(
			payload({
				answers: { email: "jane@example.com" },
				fields: [
					{
						id: "email",
						label: "Email Address",
						type: "email",
						required: true,
					},
				],
			}),
		);

		expect(result.applicantName).toBe("Jane Applicant");
	});

	it("throws LulafiMappingError when the email is missing", () => {
		expect(() =>
			mapLulafiFormSubmission(payload({ answers: {}, fields: [] })),
		).toThrow(LulafiMappingError);
	});

	it("throws LulafiMappingError when no name is available anywhere", () => {
		expect(() =>
			mapLulafiFormSubmission(
				payload({
					displayName: undefined,
					answers: { email: "jane@example.com" },
					fields: [
						{
							id: "email",
							label: "Email Address",
							type: "email",
							required: true,
						},
					],
				}),
			),
		).toThrow(LulafiMappingError);
	});

	it("falls back to a default reason and stuffs raw answers into notes", () => {
		const raw = { email: "jane@example.com", name: "Jane Applicant" };
		const result = mapLulafiFormSubmission(
			payload({
				answers: raw,
				fields: [
					{
						id: "email",
						label: "Email Address",
						type: "email",
						required: true,
					},
					{ id: "name", label: "Full Name", type: "text", required: true },
				],
			}),
		);

		expect(result.answers.reason).toBe("Submitted via LulaFi membership form.");
		expect(JSON.parse(result.answers.notes)).toEqual(raw);
	});
});
