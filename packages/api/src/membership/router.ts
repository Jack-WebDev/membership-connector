import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "../index";
import { memberProcedure } from "../procedures";
import {
	findPublicMembershipBySlug,
	getPublicMembershipBySlug,
	isMembershipSavedByUser,
	listPublicMembershipFilterOptions,
	listPublicMemberships,
	toggleSavedMembership,
} from "./service";
import {
	findPublicMembershipBySlugInput,
	getPublicMembershipInput,
	listPublicMembershipsInput,
	toggleSavedMembershipInput,
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
});
