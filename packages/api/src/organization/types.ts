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
