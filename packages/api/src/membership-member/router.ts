import { router } from "../index";
import { memberProcedure } from "../procedures";
import {
	getMemberDashboardSummary,
	getMembershipForUser,
	listActiveMembershipsForUser,
} from "./service";
import { membershipIdInput } from "./types";

export const membershipMemberRouter = router({
	listMine: memberProcedure.query(({ ctx }) =>
		listActiveMembershipsForUser(ctx.session.user.id),
	),

	getMine: memberProcedure
		.input(membershipIdInput)
		.query(({ ctx, input }) =>
			getMembershipForUser(ctx.session.user.id, input.membershipId),
		),

	dashboardSummary: memberProcedure.query(({ ctx }) =>
		getMemberDashboardSummary(ctx.session.user.id),
	),
});
