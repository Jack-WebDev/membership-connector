import { router } from "../index";
import { organizationPermissionProcedure } from "../procedures";
import {
	archiveMembershipTier,
	createMembershipTier,
	getAdminMembershipTierById,
	getAdminTierStats,
	listActiveTierMembershipOptions,
	listAdminMembershipTiers,
	toggleMembershipTierActive,
	updateMembershipTier,
} from "./service";
import {
	createTierInput,
	listAdminTiersInput,
	tierIdInput,
	updateTierInput,
} from "./types";

export const membershipTierRouter = router({
	adminList: organizationPermissionProcedure("manage_tiers")
		.input(listAdminTiersInput)
		.query(({ ctx, input }) =>
			listAdminMembershipTiers(ctx.organization.organizationId, input),
		),

	adminStats: organizationPermissionProcedure("manage_tiers").query(({ ctx }) =>
		getAdminTierStats(ctx.organization.organizationId),
	),

	adminMembershipOptions: organizationPermissionProcedure("manage_tiers").query(
		({ ctx }) =>
			listActiveTierMembershipOptions(ctx.organization.organizationId),
	),

	adminGet: organizationPermissionProcedure("manage_tiers")
		.input(tierIdInput)
		.query(({ ctx, input }) =>
			getAdminMembershipTierById(ctx.organization.organizationId, input.tierId),
		),

	adminCreate: organizationPermissionProcedure("manage_tiers")
		.input(createTierInput)
		.mutation(({ ctx, input }) =>
			createMembershipTier(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),

	adminUpdate: organizationPermissionProcedure("manage_tiers")
		.input(updateTierInput)
		.mutation(({ ctx, input }) =>
			updateMembershipTier(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),

	adminToggleActive: organizationPermissionProcedure("manage_tiers")
		.input(tierIdInput)
		.mutation(({ ctx, input }) =>
			toggleMembershipTierActive(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.tierId,
			),
		),

	adminArchive: organizationPermissionProcedure("manage_tiers")
		.input(tierIdInput)
		.mutation(({ ctx, input }) =>
			archiveMembershipTier(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.tierId,
			),
		),
});
