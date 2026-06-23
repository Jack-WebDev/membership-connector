import { router } from "../index";
import { memberProcedure } from "../procedures";
import {
	listRecentAnnouncementsForUser,
	listVisibleAnnouncementsForMembershipMember,
} from "./service";
import { membershipIdInput } from "./types";

export const announcementRouter = router({
	listForMembership: memberProcedure
		.input(membershipIdInput)
		.query(({ ctx, input }) =>
			listVisibleAnnouncementsForMembershipMember(
				ctx.session.user.id,
				input.membershipId,
			),
		),

	listRecentForUser: memberProcedure.query(({ ctx }) =>
		listRecentAnnouncementsForUser(ctx.session.user.id),
	),
});
