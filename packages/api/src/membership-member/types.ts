import { z } from "zod";

export const membershipIdInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type MembershipIdInput = z.infer<typeof membershipIdInput>;

export type MemberMembershipStatus =
	| "active"
	| "pending_payment"
	| "expired"
	| "cancelled"
	| "suspended";

export type MemberMembershipSummary = {
	id: string;
	status: MemberMembershipStatus;
	membershipId: string;
	membershipName: string;
	membershipSlug: string;
	organizationName: string;
	organizationSlug: string;
	tierName: string;
	startedAt: Date;
	expiresAt: Date | null;
	cancelledAt: Date | null;
};

export type MemberMembershipDetail = MemberMembershipSummary & {
	membershipDescription: string | null;
	tierPrice: string;
	tierCurrency: string;
	tierBillingInterval:
		| "free"
		| "once_off"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "custom";
	tierBenefits: unknown[];
	tierRequirements: unknown[];
	organizationEmail: string | null;
	organizationPhone: string | null;
	organizationWebsiteUrl: string | null;
};

export type MemberDashboardSummary = {
	activeMemberships: number;
	pendingApplications: number;
	approvedApplications: number;
	rejectedApplications: number;
	savedMemberships: number;
};

export const memberIdInput = z.object({
	memberId: z.string().trim().min(1),
});
export type MemberIdInput = z.infer<typeof memberIdInput>;

const memberStatusValues = [
	"active",
	"pending_payment",
	"expired",
	"cancelled",
	"suspended",
] as const;

export const listAdminMembersInput = z.object({
	search: z.string().trim().max(160).optional(),
	status: z.enum(memberStatusValues).optional(),
	membershipId: z.string().trim().min(1).optional(),
	membershipTierId: z.string().trim().min(1).optional(),
	paymentStatus: z.enum(["paid", "pending"]).optional(),
	joinedFrom: z.coerce.date().optional(),
	joinedTo: z.coerce.date().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminMembersInput = z.infer<typeof listAdminMembersInput>;

export const updateMemberStatusInput = z.object({
	memberId: z.string().trim().min(1),
	target: z.enum(["active", "suspended", "cancelled"]),
});
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusInput>;

export const changeMemberTierInput = z.object({
	memberId: z.string().trim().min(1),
	membershipTierId: z.string().trim().min(1),
});
export type ChangeMemberTierInput = z.infer<typeof changeMemberTierInput>;

export const updateMemberNotesInput = z.object({
	memberId: z.string().trim().min(1),
	notes: z.string().trim().max(2000).optional().default(""),
});
export type UpdateMemberNotesInput = z.infer<typeof updateMemberNotesInput>;

export type AdminMemberPaymentStatus = "paid" | "pending";

export type AdminMemberSummary = {
	id: string;
	status: MemberMembershipStatus;
	paymentStatus: AdminMemberPaymentStatus;
	userId: string;
	userName: string;
	userEmail: string;
	membershipId: string;
	membershipName: string;
	membershipTierId: string;
	tierName: string;
	startedAt: Date;
	expiresAt: Date | null;
};

export type AdminMemberApplicationSummary = {
	id: string;
	status: string;
	submittedAt: Date | null;
};

export type AdminMemberFinanceRecordSummary = {
	id: string;
	amount: string;
	currency: string;
	status: string;
	type: string;
	createdAt: Date;
};

export type AdminMemberCommentSummary = {
	id: string;
	body: string;
	createdAt: Date;
	announcementTitle: string;
};

export type AdminMemberDetail = AdminMemberSummary & {
	userImage: string | null;
	cancelledAt: Date | null;
	notes: string | null;
	tierPrice: string;
	tierCurrency: string;
	tierBillingInterval: MemberMembershipDetail["tierBillingInterval"];
	applications: AdminMemberApplicationSummary[];
	financeRecords: AdminMemberFinanceRecordSummary[];
	comments: AdminMemberCommentSummary[];
};

export type AdminMemberFilterOptions = {
	memberships: { id: string; name: string }[];
	tiers: { id: string; membershipId: string; name: string }[];
};
