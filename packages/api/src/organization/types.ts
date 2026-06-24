import { z } from "zod";

import type { PublicMembershipSummary } from "../membership/types";

export const listPublicOrganizationsInput = z.object({
	search: z.string().trim().max(160).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListPublicOrganizationsInput = z.infer<
	typeof listPublicOrganizationsInput
>;

export type ListPublicOrganizationsResult = {
	items: PublicOrganizationSummary[];
	total: number;
};

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

const optionalEmail = z
	.string()
	.trim()
	.refine((value) => value === "" || z.email().safeParse(value).success, {
		message: "Invalid email address",
	});

const optionalUrl = z
	.string()
	.trim()
	.refine((value) => value === "" || z.url().safeParse(value).success, {
		message: "Invalid URL",
	});

export const organizationUpdateInput = z.object({
	name: z.string().trim().min(2, "Organization name is required").max(160),
	description: z.string().trim().max(2000),
	websiteUrl: optionalUrl,
	email: optionalEmail,
	phone: z.string().trim().max(32),
});
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateInput>;

export type OrganizationAdminDetail = {
	id: string;
	name: string;
	description: string | null;
	websiteUrl: string | null;
	email: string | null;
	phone: string | null;
};

export type OrganizationDashboardRecentApplication = {
	id: string;
	applicantName: string;
	membershipName: string;
	status: string;
	submittedAt: Date | null;
};

export type OrganizationDashboardRecentMember = {
	id: string;
	userName: string;
	membershipName: string;
	status: string;
	startedAt: Date;
};

export type OrganizationDashboardRecentComment = {
	id: string;
	userName: string;
	announcementTitle: string;
	body: string;
	createdAt: Date;
};

export type OrganizationDashboardRecentFinanceRecord = {
	id: string;
	amount: string;
	currency: string;
	status: string;
	type: string;
	createdAt: Date;
};

export type OrganizationDashboardOverview = {
	activeMembers: number;
	pendingApplications: number;
	approvedApplications: number;
	rejectedApplications: number;
	publishedMemberships: number;
	pausedMemberships: number;
	monthlyRevenue: string;
	currency: string;
	recentApplications: OrganizationDashboardRecentApplication[];
	recentMembers: OrganizationDashboardRecentMember[];
	recentComments: OrganizationDashboardRecentComment[];
	recentFinanceRecords: OrganizationDashboardRecentFinanceRecord[];
};
