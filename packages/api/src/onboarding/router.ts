import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../index";
import {
	completeMemberOnboarding,
	completeOrganizationOnboarding,
} from "./service";
import { memberOnboardingInput, organizationOnboardingInput } from "./types";

export const onboardingRouter = router({
	completeMember: protectedProcedure
		.input(memberOnboardingInput)
		.mutation(async ({ ctx, input }) => {
			return completeMemberOnboarding(ctx.session.user.id, input);
		}),

	completeOrganization: protectedProcedure
		.input(organizationOnboardingInput)
		.mutation(async ({ ctx, input }) => {
			try {
				return await completeOrganizationOnboarding(ctx.session.user.id, input);
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				if (
					typeof error === "object" &&
					error !== null &&
					"code" in error &&
					(error as { code?: string }).code === "23505"
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "That organization slug is already taken. Try another.",
					});
				}

				throw error;
			}
		}),
});
