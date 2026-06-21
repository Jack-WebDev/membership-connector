import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "../index";
import {
	memberProcedure,
	organizationPermissionProcedure,
} from "../procedures";
import {
	createMembership,
	findPublicMembershipBySlug,
	getAdminMembershipById,
	getAdminMembershipStats,
	getPublicMembershipBySlug,
	isMembershipSavedByUser,
	listAdminMemberships,
	listPublicMembershipFilterOptions,
	listPublicMemberships,
	toggleSavedMembership,
	transitionMembershipStatus,
	updateMembership,
} from "./service";
import {
	createMembershipInput,
	findPublicMembershipBySlugInput,
	getPublicMembershipInput,
	listAdminMembershipsInput,
	listPublicMembershipsInput,
	membershipIdInput,
	toggleSavedMembershipInput,
	updateMembershipInput,
} from "./types";

export const membershipRouter = router({
	listPublic: publicProcedure
		.input(listPublicMembershipsInput)
		.query(({ input }) => listPublicMemberships(input)),

	listFilterOptions: publicProcedure.query(() =>
		listPublicMembershipFilterOptions(),
	),

	getPublicBySlug: publicProcedure
		.input(getPublicMembershipInput)
		.query(async ({ input }) => {
			const membership = await getPublicMembershipBySlug(
				input.organizationSlug,
				input.membershipSlug,
			);

			if (!membership) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "This membership is not available",
				});
			}

			return membership;
		}),

	findPublicBySlug: publicProcedure
		.input(findPublicMembershipBySlugInput)
		.query(({ input }) => findPublicMembershipBySlug(input.membershipSlug)),

	toggleSaved: memberProcedure
		.input(toggleSavedMembershipInput)
		.mutation(({ ctx, input }) =>
			toggleSavedMembership(ctx.session.user.id, input.membershipId),
		),

	isSaved: memberProcedure
		.input(toggleSavedMembershipInput)
		.query(({ ctx, input }) =>
			isMembershipSavedByUser(ctx.session.user.id, input.membershipId),
		),

	adminList: organizationPermissionProcedure("manage_memberships")
		.input(listAdminMembershipsInput)
		.query(({ ctx, input }) =>
			listAdminMemberships(ctx.organization.organizationId, input),
		),

	adminStats: organizationPermissionProcedure("manage_memberships").query(
		({ ctx }) => getAdminMembershipStats(ctx.organization.organizationId),
	),

	adminGet: organizationPermissionProcedure("manage_memberships")
		.input(membershipIdInput)
		.query(({ ctx, input }) =>
			getAdminMembershipById(
				ctx.organization.organizationId,
				input.membershipId,
			),
		),

	adminCreate: organizationPermissionProcedure("manage_memberships")
		.input(createMembershipInput)
		.mutation(({ ctx, input }) =>
			createMembership(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),

	adminUpdate: organizationPermissionProcedure("manage_memberships")
		.input(updateMembershipInput)
		.mutation(({ ctx, input }) =>
			updateMembership(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),

	adminPublish: organizationPermissionProcedure("manage_memberships")
		.input(membershipIdInput)
		.mutation(({ ctx, input }) =>
			transitionMembershipStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.membershipId,
				"published",
			),
		),

	adminPause: organizationPermissionProcedure("manage_memberships")
		.input(membershipIdInput)
		.mutation(({ ctx, input }) =>
			transitionMembershipStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.membershipId,
				"paused",
			),
		),

	adminArchive: organizationPermissionProcedure("manage_memberships")
		.input(membershipIdInput)
		.mutation(({ ctx, input }) =>
			transitionMembershipStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.membershipId,
				"archived",
			),
		),
});
