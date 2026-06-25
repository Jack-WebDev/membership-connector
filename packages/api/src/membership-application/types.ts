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

export type MemberMembershipStatusInfo = {
	currentTier: {
		membershipTierId: string;
		status: "active" | "pending_payment";
	} | null;
	pendingApplication: {
		membershipTierId: string;
		status: "submitted" | "under_review" | "needs_information";
	} | null;
};

const applicationStatusValues = [
	"draft",
	"submitted",
	"under_review",
	"needs_information",
	"approved",
	"rejected",
	"withdrawn",
	"cancelled",
] as const;

export const listAdminApplicationsInput = z.object({
	search: z.string().trim().max(160).optional(),
	status: z.enum(applicationStatusValues).optional(),
	membershipId: z.string().trim().min(1).optional(),
	membershipTierId: z.string().trim().min(1).optional(),
	submittedFrom: z.coerce.date().optional(),
	submittedTo: z.coerce.date().optional(),
	sortBy: z.enum(["submittedAt", "updatedAt"]).default("updatedAt"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminApplicationsInput = z.infer<
	typeof listAdminApplicationsInput
>;

export const listMemberApplicationsInput = z.object({
	search: z.string().trim().max(160).optional(),
	status: z.enum(applicationStatusValues).optional(),
	sortBy: z.enum(["submittedAt", "updatedAt"]).default("updatedAt"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMemberApplicationsInput = z.infer<
	typeof listMemberApplicationsInput
>;

export const reviewNotesInput = z.object({
	applicationId: z.string().trim().min(1),
	reviewNotes: z.string().trim().max(2000).optional(),
});
export type ReviewNotesInput = z.infer<typeof reviewNotesInput>;

export const rejectApplicationInput = z.object({
	applicationId: z.string().trim().min(1),
	reviewNotes: z
		.string()
		.trim()
		.min(1, "A rejection reason is required")
		.max(2000),
});
export type RejectApplicationInput = z.infer<typeof rejectApplicationInput>;

export const requestApplicationInformationInput = z.object({
	applicationId: z.string().trim().min(1),
	message: z.string().trim().min(1, "A message is required").max(2000),
});
export type RequestApplicationInformationInput = z.infer<
	typeof requestApplicationInformationInput
>;

export type AdminApplicationSummary = {
	id: string;
	status: MemberApplicationStatus;
	membershipId: string;
	membershipName: string;
	membershipTierId: string;
	tierName: string;
	applicantUserId: string;
	applicantName: string;
	applicantEmail: string;
	submittedAt: Date | null;
	updatedAt: Date;
};

export type AdminApplicationDetail = AdminApplicationSummary & {
	answers: Record<string, unknown>;
	reviewNotes: string | null;
	reviewedAt: Date | null;
	reviewedByUserId: string | null;
	createdAt: Date;
	member: {
		id: string;
		status:
			| "active"
			| "pending_payment"
			| "expired"
			| "cancelled"
			| "suspended";
	} | null;
};

export type AdminApplicationFilterOptions = {
	memberships: { id: string; name: string }[];
	tiers: { id: string; membershipId: string; name: string }[];
};
