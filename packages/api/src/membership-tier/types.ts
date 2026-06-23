import { z } from "zod";

const billingIntervalValues = [
	"free",
	"once_off",
	"monthly",
	"quarterly",
	"yearly",
	"custom",
] as const;

const tierEditableStatusValues = ["active", "inactive"] as const;
const tierStatusValues = ["active", "inactive", "archived"] as const;

const tierEditableFields = {
	name: z.string().trim().min(2, "Tier name is required").max(160),
	description: z.string().trim().max(2000).optional(),
	price: z.coerce.number().min(0, "Price cannot be negative"),
	currency: z.string().trim().min(1).max(10).default("ZAR"),
	billingInterval: z.enum(billingIntervalValues),
	benefits: z.array(z.string().trim().min(1)).default([]),
	requirements: z.array(z.string().trim().min(1)).default([]),
	maxMembers: z.coerce.number().int().min(1).optional(),
	status: z.enum(tierEditableStatusValues).default("active"),
};

export const createTierInput = z.object({
	membershipId: z.string().trim().min(1),
	...tierEditableFields,
});
export type CreateTierInput = z.infer<typeof createTierInput>;

export const updateTierInput = z.object({
	tierId: z.string().trim().min(1),
	sortOrder: z.coerce.number().int().min(0).optional(),
	...tierEditableFields,
});
export type UpdateTierInput = z.infer<typeof updateTierInput>;

export const tierIdInput = z.object({
	tierId: z.string().trim().min(1),
});
export type TierIdInput = z.infer<typeof tierIdInput>;

export const listAdminTiersInput = z.object({
	membershipId: z.string().trim().min(1).optional(),
	status: z.enum(tierStatusValues).optional(),
	search: z.string().trim().max(160).optional(),
	sortBy: z.enum(["sortOrder", "name", "price"]).default("sortOrder"),
	sortDir: z.enum(["asc", "desc"]).default("asc"),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminTiersInput = z.infer<typeof listAdminTiersInput>;

export type AdminTierSummary = {
	id: string;
	name: string;
	membershipId: string;
	membershipName: string;
	price: string;
	currency: string;
	billingInterval: (typeof billingIntervalValues)[number];
	status: (typeof tierStatusValues)[number];
	maxMembers: number | null;
	sortOrder: number;
	updatedAt: Date;
};

export type AdminTierDetail = {
	id: string;
	membershipId: string;
	membershipName: string;
	name: string;
	description: string | null;
	price: string;
	currency: string;
	billingInterval: (typeof billingIntervalValues)[number];
	benefits: unknown[];
	requirements: unknown[];
	maxMembers: number | null;
	status: (typeof tierStatusValues)[number];
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
};

export type AdminTierStats = {
	active: number;
	inactive: number;
	archived: number;
	total: number;
};
