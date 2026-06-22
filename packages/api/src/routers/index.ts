import { protectedProcedure, publicProcedure, router } from "../index";
import { membershipRouter } from "../membership/router";
import { membershipApplicationRouter } from "../membership-application/router";
import { membershipTierRouter } from "../membership-tier/router";
import { onboardingRouter } from "../onboarding/router";
import { organizationRouter } from "../organization/router";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	onboarding: onboardingRouter,
	membership: membershipRouter,
	membershipTier: membershipTierRouter,
	membershipApplication: membershipApplicationRouter,
	organization: organizationRouter,
});
export type AppRouter = typeof appRouter;
