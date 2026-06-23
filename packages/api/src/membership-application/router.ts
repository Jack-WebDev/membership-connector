import { router } from "../index";
import {
	memberProcedure,
	organizationPermissionProcedure,
} from "../procedures";
import {
	approveApplication,
	getApplicationForReview,
	getDraftApplicationForMembership,
	getMemberApplicationDetail,
	listApplicationFilterOptions,
	listApplicationsForReview,
	listMemberApplications,
	markApplicationPaymentReceived,
	markApplicationUnderReview,
	rejectApplication,
	requestApplicationInformation,
	respondToInformationRequest,
	saveApplicationDraft,
	submitApplication,
	withdrawApplication,
} from "./service";
import {
	applicationIdInput,
	listAdminApplicationsInput,
	listMemberApplicationsInput,
	membershipIdInput,
	rejectApplicationInput,
	requestApplicationInformationInput,
	respondToInformationRequestInput,
	reviewNotesInput,
	saveApplicationDraftInput,
	submitApplicationInput,
} from "./types";

export const membershipApplicationRouter = router({
	listMine: memberProcedure
		.input(listMemberApplicationsInput)
		.query(({ ctx, input }) =>
			listMemberApplications(ctx.session.user.id, input),
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

	adminList: organizationPermissionProcedure("view_applications")
		.input(listAdminApplicationsInput)
		.query(({ ctx, input }) =>
			listApplicationsForReview(ctx.organization.organizationId, input),
		),

	adminFilterOptions: organizationPermissionProcedure(
		"view_applications",
	).query(({ ctx }) =>
		listApplicationFilterOptions(ctx.organization.organizationId),
	),

	adminGet: organizationPermissionProcedure("view_applications")
		.input(applicationIdInput)
		.query(({ ctx, input }) =>
			getApplicationForReview(
				ctx.organization.organizationId,
				input.applicationId,
			),
		),

	adminMarkUnderReview: organizationPermissionProcedure("review_applications")
		.input(applicationIdInput)
		.mutation(({ ctx, input }) =>
			markApplicationUnderReview(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.applicationId,
			),
		),

	adminApprove: organizationPermissionProcedure("review_applications")
		.input(reviewNotesInput)
		.mutation(({ ctx, input }) =>
			approveApplication(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.applicationId,
				input.reviewNotes,
			),
		),

	adminReject: organizationPermissionProcedure("review_applications")
		.input(rejectApplicationInput)
		.mutation(({ ctx, input }) =>
			rejectApplication(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.applicationId,
				input.reviewNotes,
			),
		),

	adminRequestInformation: organizationPermissionProcedure(
		"review_applications",
	)
		.input(requestApplicationInformationInput)
		.mutation(({ ctx, input }) =>
			requestApplicationInformation(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.applicationId,
				input.message,
			),
		),

	adminMarkPaymentReceived: organizationPermissionProcedure(
		"review_applications",
	)
		.input(applicationIdInput)
		.mutation(({ ctx, input }) =>
			markApplicationPaymentReceived(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.applicationId,
			),
		),
});
