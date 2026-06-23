import { announcementRouter } from "../announcement/router";
import { financeRouter } from "../finance/router";
import { protectedProcedure, publicProcedure, router } from "../index";
import { membershipRouter } from "../membership/router";
import { membershipApplicationRouter } from "../membership-application/router";
import { membershipMemberRouter } from "../membership-member/router";
import { membershipTierRouter } from "../membership-tier/router";
import { notificationRouter } from "../notification/router";
import { onboardingRouter } from "../onboarding/router";
import { organizationRouter } from "../organization/router";
import { organizationAdminRouter } from "../organization-admin/router";
import { userRouter } from "../user/router";

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
	membershipMember: membershipMemberRouter,
	announcement: announcementRouter,
	finance: financeRouter,
	notification: notificationRouter,
	user: userRouter,
	organization: organizationRouter,
	organizationAdmin: organizationAdminRouter,
});
export type AppRouter = typeof appRouter;
