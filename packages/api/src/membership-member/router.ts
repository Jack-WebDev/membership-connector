import { router } from "../index";
import {
	memberProcedure,
	organizationPermissionProcedure,
} from "../procedures";
import {
	changeMemberTier,
	getMemberDashboardSummary,
	getMembershipForUser,
	getOrganizationMemberDetail,
	listActiveMembershipsForUser,
	listMemberFilterOptions,
	listOrganizationMembers,
	updateMemberNotes,
	updateMemberStatus,
} from "./service";
import {
	changeMemberTierInput,
	listAdminMembersInput,
	listMemberMembershipsInput,
	memberIdInput,
	membershipIdInput,
	updateMemberNotesInput,
	updateMemberStatusInput,
} from "./types";

export const membershipMemberRouter = router({
	listMine: memberProcedure
		.input(listMemberMembershipsInput)
		.query(({ ctx, input }) =>
			listActiveMembershipsForUser(ctx.session.user.id, input),
		),

	getMine: memberProcedure
		.input(membershipIdInput)
		.query(({ ctx, input }) =>
			getMembershipForUser(ctx.session.user.id, input.membershipId),
		),

	dashboardSummary: memberProcedure.query(({ ctx }) =>
		getMemberDashboardSummary(ctx.session.user.id),
	),

	adminList: organizationPermissionProcedure("manage_members")
		.input(listAdminMembersInput)
		.query(({ ctx, input }) =>
			listOrganizationMembers(ctx.organization.organizationId, input),
		),

	adminFilterOptions: organizationPermissionProcedure("manage_members").query(
		({ ctx }) => listMemberFilterOptions(ctx.organization.organizationId),
	),

	adminGet: organizationPermissionProcedure("manage_members")
		.input(memberIdInput)
		.query(({ ctx, input }) =>
			getOrganizationMemberDetail(
				ctx.organization.organizationId,
				input.memberId,
			),
		),

	adminUpdateStatus: organizationPermissionProcedure("manage_members")
		.input(updateMemberStatusInput)
		.mutation(({ ctx, input }) =>
			updateMemberStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.memberId,
				input.target,
			),
		),

	adminChangeTier: organizationPermissionProcedure("manage_members")
		.input(changeMemberTierInput)
		.mutation(({ ctx, input }) =>
			changeMemberTier(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.memberId,
				input.membershipTierId,
			),
		),

	adminUpdateNotes: organizationPermissionProcedure("manage_members")
		.input(updateMemberNotesInput)
		.mutation(({ ctx, input }) =>
			updateMemberNotes(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.memberId,
				input.notes,
			),
		),
});
