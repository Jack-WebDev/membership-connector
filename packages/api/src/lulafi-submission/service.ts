import type { ChatFormSubmissionMessage } from "@hubnet-systems/chat-sdk";
import { db } from "@membership-connector-app/db";
import { lulafiSubmissions } from "@membership-connector-app/db/schema/lulafi-submission";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

import type {
	ListLulafiSubmissionsInput,
	LulafiSubmissionDetail,
	LulafiSubmissionListResult,
	LulafiSubmissionNormalizedPayload,
	LulafiSubmissionReadableField,
} from "./types";

function toJsonSafe(value: unknown): unknown {
	const seen = new WeakSet<object>();
	const json = JSON.stringify(value, (key, val) => {
		if (key === "parent") {
			return undefined;
		}

		if (val !== null && typeof val === "object") {
			if (seen.has(val)) {
				return undefined;
			}
			seen.add(val);
		}

		return val;
	});

	return json === undefined ? null : JSON.parse(json);
}

function stringifyValue(value: unknown): string {
	if (value == null) {
		return "";
	}

	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (Array.isArray(value)) {
		return value.map((entry) => stringifyValue(entry)).join(", ");
	}

	if (typeof value === "object") {
		return JSON.stringify(value);
	}

	return String(value);
}

function titleFromKey(key: string): string {
	return key
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^./, (value) => value.toUpperCase());
}

function collectReadableFields(
	value: unknown,
	prefix = "",
): LulafiSubmissionReadableField[] {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return [];
	}

	const objectValue = value as Record<string, unknown>;
	const fields: LulafiSubmissionReadableField[] = [];

	for (const [key, entry] of Object.entries(objectValue)) {
		const fieldKey = prefix ? `${prefix}.${key}` : key;

		if (
			entry &&
			typeof entry === "object" &&
			!Array.isArray(entry) &&
			"label" in entry &&
			"value" in entry
		) {
			const label =
				typeof entry.label === "string" && entry.label.trim().length > 0
					? entry.label
					: titleFromKey(key);
			fields.push({
				key: fieldKey,
				label,
				value: stringifyValue(entry.value),
			});
			continue;
		}

		if (
			entry &&
			typeof entry === "object" &&
			!Array.isArray(entry) &&
			Object.values(entry).some(
				(candidate) =>
					candidate &&
					typeof candidate === "object" &&
					!Array.isArray(candidate) &&
					"label" in (candidate as Record<string, unknown>) &&
					"value" in (candidate as Record<string, unknown>),
			)
		) {
			fields.push(...collectReadableFields(entry, fieldKey));
			continue;
		}

		fields.push({
			key: fieldKey,
			label: titleFromKey(key),
			value: stringifyValue(entry),
		});
	}

	return fields;
}

type FormDefinition = {
	id: string | null;
	version: string | null;
	title: string | null;
};

export function resolveFormMetadata(
	message: Pick<
		ChatFormSubmissionMessage,
		"metadata" | "formId" | "formVersion" | "fields"
	>,
): FormDefinition {
	const metadata =
		message.metadata && typeof message.metadata === "object"
			? (message.metadata as Record<string, unknown>)
			: undefined;
	const form =
		metadata?.form && typeof metadata.form === "object"
			? (metadata.form as Record<string, unknown>)
			: undefined;

	const titleFromFields =
		message.fields && message.fields.length > 0
			? message.fields.map((field) => field.label).join(", ")
			: null;

	return {
		id:
			typeof form?.id === "string"
				? form.id
				: typeof message.formId === "string"
					? message.formId
					: null,
		version:
			form?.version != null
				? String(form.version)
				: message.formVersion != null
					? String(message.formVersion)
					: null,
		title: typeof form?.title === "string" ? form.title : titleFromFields,
	};
}

export function normalizeSubmissionPayload(
	payload: Record<string, unknown>,
): LulafiSubmissionNormalizedPayload {
	if (!payload.readable || typeof payload.readable !== "object") {
		return payload;
	}

	const readableFields = collectReadableFields(payload.readable);

	if (readableFields.length > 0) {
		return {
			source: "readable",
			fields: readableFields,
		};
	}

	return payload;
}

export async function insertLulafiSubmissionIfNew(
	message: ChatFormSubmissionMessage,
): Promise<{ inserted: boolean; submissionId: string | null }> {
	const form = resolveFormMetadata(message);
	const rawPayload = (
		message.raw && typeof message.raw === "object"
			? (message.raw as Record<string, unknown>)
			: { message }
	) as Record<string, unknown>;
	const safeRawPayload = toJsonSafe(rawPayload) as Record<string, unknown>;
	const normalizedPayload = normalizeSubmissionPayload(message.payload);

	const inserted = await db
		.insert(lulafiSubmissions)
		.values({
			id: crypto.randomUUID(),
			externalEventId: message.id,
			source: "lulafi-chat",
			roomId: message.roomId,
			submissionRoomId: message.submissionRoomId ?? null,
			fromUserId: message.fromUserId,
			fromDeviceId: message.fromDeviceId,
			correlationId: message.correlationId ?? null,
			recordId: message.recordId ?? null,
			providerDirectMessageRoomId: message.providerDirectMessageRoomId ?? null,
			displayName: message.displayName ?? null,
			formId: form.id,
			formVersion: form.version,
			formTitle: form.title,
			rawPayload: safeRawPayload,
			normalizedPayload,
			submittedAt: Number.isFinite(message.timestamp)
				? new Date(message.timestamp)
				: null,
			receivedAt: new Date(),
		})
		.onConflictDoNothing({
			target: lulafiSubmissions.externalEventId,
		})
		.returning({ id: lulafiSubmissions.id });

	return {
		inserted: inserted.length > 0,
		submissionId: inserted[0]?.id ?? null,
	};
}

export async function listLulafiSubmissions(
	input: ListLulafiSubmissionsInput,
): Promise<LulafiSubmissionListResult> {
	const rows = await db.query.lulafiSubmissions.findMany({
		orderBy: [
			desc(lulafiSubmissions.receivedAt),
			desc(lulafiSubmissions.submittedAt),
		],
	});

	const total = rows.length;
	const start = (input.page - 1) * input.pageSize;

	return {
		items: rows.slice(start, start + input.pageSize),
		total,
	};
}

export async function getLulafiSubmissionById(
	submissionId: string,
): Promise<LulafiSubmissionDetail> {
	const submission = await db.query.lulafiSubmissions.findFirst({
		where: eq(lulafiSubmissions.id, submissionId),
	});

	if (!submission) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "LulaFi submission not found",
		});
	}

	return submission;
}
