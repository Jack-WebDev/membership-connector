import type { OrganizationAdminRole } from "../account-access";

export const ORGANIZATION_PERMISSIONS = [
	"view_organization_dashboard",
	"update_organization_settings",
	"manage_memberships",
	"manage_tiers",
	"view_applications",
	"review_applications",
	"manage_members",
	"post_announcements",
	"manage_announcements",
	"view_finances",
	"manage_finance_records",
	"invite_admins",
	"change_admin_roles",
	"remove_admins",
	"view_audit_logs",
] as const;

export type OrganizationPermission = (typeof ORGANIZATION_PERMISSIONS)[number];

const ALL_BUT_ADMIN_MANAGEMENT: readonly OrganizationPermission[] = [
	"view_organization_dashboard",
	"update_organization_settings",
	"manage_memberships",
	"manage_tiers",
	"view_applications",
	"review_applications",
	"manage_members",
	"post_announcements",
	"manage_announcements",
	"view_finances",
	"manage_finance_records",
	"invite_admins",
	"view_audit_logs",
];

export const organizationRolePermissions: Record<
	OrganizationAdminRole,
	readonly OrganizationPermission[]
> = {
	owner: ORGANIZATION_PERMISSIONS,
	admin: ALL_BUT_ADMIN_MANAGEMENT,
	membership_manager: [
		"view_organization_dashboard",
		"manage_memberships",
		"manage_tiers",
		"view_applications",
		"review_applications",
		"manage_members",
	],
	finance_manager: [
		"view_organization_dashboard",
		"view_finances",
		"manage_finance_records",
	],
	content_manager: [
		"view_organization_dashboard",
		"post_announcements",
		"manage_announcements",
	],
	reviewer: [
		"view_organization_dashboard",
		"view_applications",
		"review_applications",
	],
};

export function hasOrganizationPermission(
	role: OrganizationAdminRole,
	permission: OrganizationPermission,
): boolean {
	return organizationRolePermissions[role].includes(permission);
}
