import { router } from "../index";
import { memberProcedure } from "../procedures";
import {
	getDraftApplicationForMembership,
	getMemberApplicationDetail,
	listMemberApplications,
	respondToInformationRequest,
	saveApplicationDraft,
	submitApplication,
	withdrawApplication,
} from "./service";
import {
	applicationIdInput,
	membershipIdInput,
	respondToInformationRequestInput,
	saveApplicationDraftInput,
	submitApplicationInput,
} from "./types";

export const membershipApplicationRouter = router({
	listMine: memberProcedure.query(({ ctx }) =>
		listMemberApplications(ctx.session.user.id),
	),

	getMine: memberProcedure
		.input(applicationIdInput)
		.query(({ ctx, input }) =>
			getMemberApplicationDetail(ctx.session.user.id, input.applicationId),
		),

	getDraftForMembership: memberProcedure
		.input(membershipIdInput)
		.query(({ ctx, input }) =>
			getDraftApplicationForMembership(ctx.session.user.id, input.membershipId),
		),

	saveDraft: memberProcedure
		.input(saveApplicationDraftInput)
		.mutation(({ ctx, input }) =>
			saveApplicationDraft(ctx.session.user.id, input),
		),

	submit: memberProcedure
		.input(submitApplicationInput)
		.mutation(({ ctx, input }) =>
			submitApplication(ctx.session.user.id, input),
		),

	withdraw: memberProcedure
		.input(applicationIdInput)
		.mutation(({ ctx, input }) =>
			withdrawApplication(ctx.session.user.id, input.applicationId),
		),

	respondToInformationRequest: memberProcedure
		.input(respondToInformationRequestInput)
		.mutation(({ ctx, input }) =>
			respondToInformationRequest(ctx.session.user.id, input),
		),
});
