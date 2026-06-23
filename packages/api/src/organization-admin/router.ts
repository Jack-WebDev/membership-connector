import { protectedProcedure, router } from "../index";
import { organizationPermissionProcedure } from "../procedures";
import {
	acceptInvite,
	changeAdminRole,
	inviteAdmin,
	listOrganizationAdmins,
	removeAdmin,
	resendInvite,
} from "./service";
import { adminIdInput, changeAdminRoleInput, inviteAdminInput } from "./types";

export const organizationAdminRouter = router({
	list: organizationPermissionProcedure("invite_admins").query(({ ctx }) =>
		listOrganizationAdmins(ctx.organization.organizationId),
	),

	invite: organizationPermissionProcedure("invite_admins")
		.input(inviteAdminInput)
		.mutation(({ ctx, input }) =>
			inviteAdmin(
				ctx.organization.organizationId,
				ctx.session.user.id,
				ctx.organization.role,
				ctx.organization.name,
				input,
			),
		),

	changeRole: organizationPermissionProcedure("change_admin_roles")
		.input(changeAdminRoleInput)
		.mutation(({ ctx, input }) =>
			changeAdminRole(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.adminId,
				input.role,
			),
		),

	remove: organizationPermissionProcedure("remove_admins")
		.input(adminIdInput)
		.mutation(({ ctx, input }) =>
			removeAdmin(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.adminId,
			),
		),

	resendInvite: organizationPermissionProcedure("invite_admins")
		.input(adminIdInput)
		.mutation(({ ctx, input }) =>
			resendInvite(
				ctx.organization.organizationId,
				ctx.session.user.id,
				ctx.organization.name,
				input.adminId,
			),
		),

	acceptInvite: protectedProcedure
		.input(adminIdInput)
		.mutation(({ ctx, input }) =>
			acceptInvite(ctx.session.user.id, input.adminId),
		),
});
