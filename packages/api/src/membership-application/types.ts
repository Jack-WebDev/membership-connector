import { z } from "zod";

export const applicationAnswersInput = z.object({
	applicantName: z.string().trim().max(160).optional().default(""),
	applicantEmail: z.string().trim().max(160).optional().default(""),
	applicantPhone: z.string().trim().max(40).optional().default(""),
	reason: z.string().trim().max(2000).optional().default(""),
	background: z.string().trim().max(2000).optional().default(""),
	notes: z.string().trim().max(2000).optional().default(""),
	agreement: z.boolean().optional().default(false),
});
export type ApplicationAnswersInput = z.infer<typeof applicationAnswersInput>;

export const saveApplicationDraftInput = z.object({
	applicationId: z.string().trim().min(1).optional(),
	membershipId: z.string().trim().min(1),
	membershipTierId: z.string().trim().min(1),
	answers: applicationAnswersInput,
});
export type SaveApplicationDraftInput = z.infer<
	typeof saveApplicationDraftInput
>;

export const submitApplicationInput = saveApplicationDraftInput;
export type SubmitApplicationInput = z.infer<typeof submitApplicationInput>;

export const applicationIdInput = z.object({
	applicationId: z.string().trim().min(1),
});
export type ApplicationIdInput = z.infer<typeof applicationIdInput>;

export const membershipIdInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type MembershipIdInput = z.infer<typeof membershipIdInput>;

export const respondToInformationRequestInput = z.object({
	applicationId: z.string().trim().min(1),
	answers: applicationAnswersInput,
});
export type RespondToInformationRequestInput = z.infer<
	typeof respondToInformationRequestInput
>;

export type MemberApplicationStatus =
	| "draft"
	| "submitted"
	| "under_review"
	| "needs_information"
	| "approved"
	| "rejected"
	| "withdrawn"
	| "cancelled";

export type MemberApplicationSummary = {
	id: string;
	status: MemberApplicationStatus;
	membershipId: string;
	membershipName: string;
	membershipSlug: string;
	organizationName: string;
	organizationSlug: string;
	tierName: string;
	submittedAt: Date | null;
	updatedAt: Date;
};

export type MemberApplicationDetail = MemberApplicationSummary & {
	membershipTierId: string;
	answers: Record<string, unknown>;
	reviewNotes: string | null;
	reviewedAt: Date | null;
	createdAt: Date;
};
