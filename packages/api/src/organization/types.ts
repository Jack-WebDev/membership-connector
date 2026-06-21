import { z } from "zod";

import type { PublicMembershipSummary } from "../membership/types";

export const listPublicOrganizationsInput = z.object({
	search: z.string().trim().max(160).optional(),
});
export type ListPublicOrganizationsInput = z.infer<
	typeof listPublicOrganizationsInput
>;

export const getPublicOrganizationInput = z.object({
	organizationSlug: z.string().trim().min(1).max(160),
});
export type GetPublicOrganizationInput = z.infer<
	typeof getPublicOrganizationInput
>;

export type PublicOrganizationSummary = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	membershipCount: number;
};

export type PublicOrganizationDetail = PublicOrganizationSummary & {
	websiteUrl: string | null;
	email: string | null;
	phone: string | null;
	memberships: PublicMembershipSummary[];
};
