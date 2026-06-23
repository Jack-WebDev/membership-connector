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
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListPublicMembershipsInput = z.infer<
	typeof listPublicMembershipsInput
>;

export type ListPublicMembershipsResult = {
	items: PublicMembershipSummary[];
	total: number;
};

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

const membershipSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const membershipStatusValues = [
	"draft",
	"published",
	"paused",
	"archived",
] as const;
const membershipVisibilityValues = [
	"public",
	"private",
	"invite_only",
] as const;

const membershipEditableFields = {
	name: z.string().trim().min(2, "Membership name is required").max(160),
	slug: z
		.string()
		.trim()
		.toLowerCase()
		.min(2, "Slug is required")
		.max(160)
		.regex(
			membershipSlugPattern,
			"Use lowercase letters, numbers, and hyphens only",
		),
	category: z.string().trim().max(160).optional(),
	shortDescription: z.string().trim().max(280).optional(),
	description: z.string().trim().max(4000).optional(),
	visibility: z.enum(membershipVisibilityValues),
	applicationRequired: z.boolean(),
	publicAnnouncementsEnabled: z.boolean(),
	membersOnlyContentEnabled: z.boolean(),
};

export const createMembershipInput = z.object(membershipEditableFields);
export type CreateMembershipInput = z.infer<typeof createMembershipInput>;

export const updateMembershipInput = z.object({
	membershipId: z.string().trim().min(1),
	...membershipEditableFields,
});
export type UpdateMembershipInput = z.infer<typeof updateMembershipInput>;

export const membershipIdInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type MembershipIdInput = z.infer<typeof membershipIdInput>;

export const listAdminMembershipsInput = z.object({
	search: z.string().trim().max(160).optional(),
	status: z.enum(membershipStatusValues).optional(),
	visibility: z.enum(membershipVisibilityValues).optional(),
	sortBy: z.enum(["updatedAt", "name"]).default("updatedAt"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminMembershipsInput = z.infer<
	typeof listAdminMembershipsInput
>;

export type AdminMembershipSummary = {
	id: string;
	name: string;
	slug: string;
	category: string | null;
	shortDescription: string | null;
	status: (typeof membershipStatusValues)[number];
	visibility: (typeof membershipVisibilityValues)[number];
	tierCount: number;
	updatedAt: Date;
};

export type AdminMembershipTier = {
	id: string;
	name: string;
	description: string | null;
	price: string;
	currency: string;
	billingInterval: PublicMembershipTierSummary["billingInterval"];
	benefits: unknown[];
	requirements: unknown[];
	maxMembers: number | null;
	status: "active" | "inactive" | "archived";
	sortOrder: number;
};

export type AdminMembershipDetail = {
	id: string;
	organizationId: string;
	name: string;
	slug: string;
	category: string | null;
	shortDescription: string | null;
	description: string | null;
	status: (typeof membershipStatusValues)[number];
	visibility: (typeof membershipVisibilityValues)[number];
	applicationRequired: boolean;
	publicAnnouncementsEnabled: boolean;
	membersOnlyContentEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
	tiers: AdminMembershipTier[];
};

export type AdminMembershipStats = {
	draft: number;
	published: number;
	paused: number;
	archived: number;
	total: number;
};
