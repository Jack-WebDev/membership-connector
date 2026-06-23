import { z } from "zod";

export const organizationAdminRoleValues = [
	"owner",
	"admin",
	"membership_manager",
	"finance_manager",
	"content_manager",
	"reviewer",
] as const;
export type OrganizationAdminRoleValue =
	(typeof organizationAdminRoleValues)[number];

export const inviteAdminInput = z.object({
	email: z.string().trim().toLowerCase().email("Enter a valid email"),
	role: z.enum(organizationAdminRoleValues),
});
export type InviteAdminInput = z.infer<typeof inviteAdminInput>;

export const changeAdminRoleInput = z.object({
	adminId: z.string().trim().min(1),
	role: z.enum(organizationAdminRoleValues),
});
export type ChangeAdminRoleInput = z.infer<typeof changeAdminRoleInput>;

export const adminIdInput = z.object({
	adminId: z.string().trim().min(1),
});
export type AdminIdInput = z.infer<typeof adminIdInput>;

export type OrganizationAdminSummary = {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	role: OrganizationAdminRoleValue;
	status: "active" | "invited";
	invitedAt: Date;
	invitedByUserId: string | null;
};
