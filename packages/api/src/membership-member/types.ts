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
