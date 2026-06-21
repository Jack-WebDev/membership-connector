import { protectedProcedure, publicProcedure, router } from "../index";
import { onboardingRouter } from "../onboarding/router";

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
});
export type AppRouter = typeof appRouter;
