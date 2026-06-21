import { z } from "zod";

export const listPublicMembershipsInput = z.object({
	search: z.string().trim().max(160).optional(),
	category: z.string().trim().max(160).optional(),
	billingInterval: z
		.enum(["free", "once_off", "monthly", "quarterly", "yearly", "custom"])
		.optional(),
	pricing: z.enum(["free", "paid"]).optional(),
	organizationSlug: z.string().trim().max(160).optional(),
	sort: z.enum(["newest"]).default("newest"),
});
export type ListPublicMembershipsInput = z.infer<
	typeof listPublicMembershipsInput
>;

export const getPublicMembershipInput = z.object({
	organizationSlug: z.string().trim().min(1).max(160),
	membershipSlug: z.string().trim().min(1).max(160),
});
export type GetPublicMembershipInput = z.infer<typeof getPublicMembershipInput>;

export const findPublicMembershipBySlugInput = z.object({
	membershipSlug: z.string().trim().min(1).max(160),
});
export type FindPublicMembershipBySlugInput = z.infer<
	typeof findPublicMembershipBySlugInput
>;

export const toggleSavedMembershipInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type ToggleSavedMembershipInput = z.infer<
	typeof toggleSavedMembershipInput
>;

export type PublicMembershipTierSummary = {
	id: string;
	name: string;
	description: string | null;
	price: string;
	currency: string;
	billingInterval:
		| "free"
		| "once_off"
		| "monthly"
		| "quarterly"
		| "yearly"
		| "custom";
	benefits: unknown[];
	requirements: unknown[];
};

export type PublicMembershipSummary = {
	id: string;
	name: string;
	slug: string;
	shortDescription: string | null;
	category: string;
	status: "draft" | "published" | "paused" | "archived";
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	activeTierCount: number;
	startingTier: {
		price: string;
		currency: string;
		billingInterval:
			| "free"
			| "once_off"
			| "monthly"
			| "quarterly"
			| "yearly"
			| "custom";
	} | null;
};

export type PublicMembershipDetail = PublicMembershipSummary & {
	description: string | null;
	applicationRequired: boolean;
	tiers: PublicMembershipTierSummary[];
};
