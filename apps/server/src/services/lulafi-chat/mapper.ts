import type { ApplicationAnswersInput } from "@membership-connector-app/api/membership-application/types";

import type { LulafiFormSubmissionPayload } from "./client";

export class LulafiMappingError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LulafiMappingError";
	}
}

export type MappedApplicant = {
	applicantName: string;
	applicantEmail: string;
	applicantPhone?: string;
	lulafiSub?: string;
	answers: ApplicationAnswersInput;
};

const EMAIL_HINTS = ["email"];
const PHONE_HINTS = ["phone"];
const NAME_HINTS = ["name"];
const REASON_HINTS = ["reason", "why"];
const BACKGROUND_HINTS = ["background"];

function findAnswer(
	payload: LulafiFormSubmissionPayload,
	hints: string[],
): string | undefined {
	const field = payload.fields.find((candidate) =>
		hints.some(
			(hint) =>
				candidate.label.toLowerCase().includes(hint) ||
				candidate.id.toLowerCase().includes(hint),
		),
	);

	if (!field) {
		return undefined;
	}

	const value = payload.answers[field.id];
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: undefined;
}

export function mapLulafiFormSubmission(
	payload: LulafiFormSubmissionPayload,
): MappedApplicant {
	const applicantEmail = findAnswer(payload, EMAIL_HINTS);
	if (!applicantEmail) {
		throw new LulafiMappingError(
			"Form submission is missing an applicant email",
		);
	}

	const applicantName =
		findAnswer(payload, NAME_HINTS) ?? payload.displayName?.trim();
	if (!applicantName) {
		throw new LulafiMappingError(
			"Form submission is missing an applicant name",
		);
	}

	const applicantPhone = findAnswer(payload, PHONE_HINTS);
	const reason = findAnswer(payload, REASON_HINTS);
	const background = findAnswer(payload, BACKGROUND_HINTS);

	const answers: ApplicationAnswersInput = {
		applicantName,
		applicantEmail,
		applicantPhone: applicantPhone ?? "",
		reason: reason ?? "Submitted via LulaFi membership form.",
		background: background ?? "",
		notes: JSON.stringify(payload.answers),
		agreement: true,
	};

	return {
		applicantName,
		applicantEmail,
		applicantPhone,
		lulafiSub: payload.fromUserId,
		answers,
	};
}
