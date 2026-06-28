import { z } from "zod";

export const listLulafiSubmissionsInput = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLulafiSubmissionsInput = z.infer<
	typeof listLulafiSubmissionsInput
>;

export const lulafiSubmissionIdInput = z.object({
	submissionId: z.string().trim().min(1),
});
export type LulafiSubmissionIdInput = z.infer<typeof lulafiSubmissionIdInput>;

export type LulafiSubmissionReadableField = {
	key: string;
	label: string;
	value: string;
};

export type LulafiSubmissionNormalizedPayload =
	| {
			source: "readable";
			fields: LulafiSubmissionReadableField[];
	  }
	| Record<string, unknown>;

export type LulafiSubmissionListItem = {
	id: string;
	externalEventId: string;
	source: string;
	roomId: string | null;
	submissionRoomId: string | null;
	fromUserId: string | null;
	fromDeviceId: string | null;
	displayName: string | null;
	formId: string | null;
	formVersion: string | null;
	formTitle: string | null;
	submittedAt: Date | null;
	receivedAt: Date;
	createdAt: Date;
};

export type LulafiSubmissionDetail = LulafiSubmissionListItem & {
	correlationId: string | null;
	recordId: string | null;
	providerDirectMessageRoomId: string | null;
	rawPayload: Record<string, unknown>;
	normalizedPayload: LulafiSubmissionNormalizedPayload;
};

export type LulafiSubmissionListResult = {
	items: LulafiSubmissionListItem[];
	total: number;
};
