import { protectedProcedure, router } from "../index";
import { getMyProfile, updateMyProfile } from "./service";
import { updateProfileInput } from "./types";

export const userRouter = router({
	getMyProfile: protectedProcedure.query(({ ctx }) =>
		getMyProfile(ctx.session.user.id),
	),

	updateMyProfile: protectedProcedure
		.input(updateProfileInput)
		.mutation(({ ctx, input }) => updateMyProfile(ctx.session.user.id, input)),
});
