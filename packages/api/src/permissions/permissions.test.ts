import { describe, expect, it } from "vitest";

import {
	hasOrganizationPermission,
	ORGANIZATION_PERMISSIONS,
	organizationRolePermissions,
} from "./permissions";

describe("organizationRolePermissions", () => {
	it("grants the owner every permission", () => {
		for (const permission of ORGANIZATION_PERMISSIONS) {
			expect(hasOrganizationPermission("owner", permission)).toBe(true);
		}
	});

	it("denies admin role/admin-management permissions but grants the rest", () => {
		expect(hasOrganizationPermission("admin", "change_admin_roles")).toBe(
			false,
		);
		expect(hasOrganizationPermission("admin", "remove_admins")).toBe(false);
		expect(hasOrganizationPermission("admin", "invite_admins")).toBe(true);
		expect(hasOrganizationPermission("admin", "view_audit_logs")).toBe(true);
	});

	it("scopes membership_manager to memberships/tiers/applications/members", () => {
		expect(
			hasOrganizationPermission("membership_manager", "manage_memberships"),
		).toBe(true);
		expect(
			hasOrganizationPermission("membership_manager", "review_applications"),
		).toBe(true);
		expect(
			hasOrganizationPermission("membership_manager", "view_finances"),
		).toBe(false);
		expect(
			hasOrganizationPermission("membership_manager", "post_announcements"),
		).toBe(false);
	});

	it("scopes finance_manager to finances only", () => {
		expect(hasOrganizationPermission("finance_manager", "view_finances")).toBe(
			true,
		);
		expect(
			hasOrganizationPermission("finance_manager", "manage_finance_records"),
		).toBe(true);
		expect(
			hasOrganizationPermission("finance_manager", "manage_memberships"),
		).toBe(false);
	});

	it("scopes content_manager to announcements only", () => {
		expect(
			hasOrganizationPermission("content_manager", "post_announcements"),
		).toBe(true);
		expect(
			hasOrganizationPermission("content_manager", "manage_announcements"),
		).toBe(true);
		expect(hasOrganizationPermission("content_manager", "view_finances")).toBe(
			false,
		);
	});

	it("scopes reviewer to viewing/reviewing applications only", () => {
		expect(hasOrganizationPermission("reviewer", "view_applications")).toBe(
			true,
		);
		expect(hasOrganizationPermission("reviewer", "review_applications")).toBe(
			true,
		);
		expect(hasOrganizationPermission("reviewer", "manage_members")).toBe(false);
	});

	it("every role can view the organization dashboard", () => {
		for (const role of Object.keys(organizationRolePermissions) as Array<
			keyof typeof organizationRolePermissions
		>) {
			expect(
				hasOrganizationPermission(role, "view_organization_dashboard"),
			).toBe(true);
		}
	});
});
