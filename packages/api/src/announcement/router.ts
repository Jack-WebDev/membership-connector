import { deleteOwnComment, setCommentStatus } from "../comment/service";
import { router } from "../index";
import {
	memberProcedure,
	organizationPermissionProcedure,
} from "../procedures";
import {
	addComment,
	createAnnouncement,
	getAdminAnnouncementById,
	listAdminAnnouncements,
	listAnnouncementFilterOptions,
	listCommentsForAnnouncementAdmin,
	listCommentsForMember,
	listRecentAnnouncementsForUser,
	listVisibleAnnouncementsForMembershipMember,
	toggleAnnouncementLike,
	toggleAnnouncementPin,
	transitionAnnouncementStatus,
	updateAnnouncement,
} from "./service";
import {
	addCommentInput,
	announcementIdInput,
	commentIdInput,
	createAnnouncementInput,
	listAdminAnnouncementsInput,
	membershipIdInput,
	setCommentStatusInput,
	togglePinInput,
	updateAnnouncementInput,
} from "./types";

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

	toggleLike: memberProcedure
		.input(announcementIdInput)
		.mutation(({ ctx, input }) =>
			toggleAnnouncementLike(ctx.session.user.id, input.announcementId),
		),

	listComments: memberProcedure
		.input(announcementIdInput)
		.query(({ ctx, input }) =>
			listCommentsForMember(ctx.session.user.id, input.announcementId),
		),

	addComment: memberProcedure
		.input(addCommentInput)
		.mutation(({ ctx, input }) => addComment(ctx.session.user.id, input)),

	deleteComment: memberProcedure
		.input(commentIdInput)
		.mutation(({ ctx, input }) =>
			deleteOwnComment(ctx.session.user.id, input.commentId),
		),

	adminList: organizationPermissionProcedure("manage_announcements")
		.input(listAdminAnnouncementsInput)
		.query(({ ctx, input }) =>
			listAdminAnnouncements(ctx.organization.organizationId, input),
		),

	adminFilterOptions: organizationPermissionProcedure(
		"manage_announcements",
	).query(({ ctx }) =>
		listAnnouncementFilterOptions(ctx.organization.organizationId),
	),

	adminGet: organizationPermissionProcedure("manage_announcements")
		.input(announcementIdInput)
		.query(({ ctx, input }) =>
			getAdminAnnouncementById(
				ctx.organization.organizationId,
				input.announcementId,
			),
		),

	adminCreate: organizationPermissionProcedure("post_announcements")
		.input(createAnnouncementInput)
		.mutation(({ ctx, input }) =>
			createAnnouncement(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),

	adminUpdate: organizationPermissionProcedure("manage_announcements")
		.input(updateAnnouncementInput)
		.mutation(({ ctx, input }) =>
			updateAnnouncement(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),

	adminPublish: organizationPermissionProcedure("manage_announcements")
		.input(announcementIdInput)
		.mutation(({ ctx, input }) =>
			transitionAnnouncementStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.announcementId,
				"published",
			),
		),

	adminArchive: organizationPermissionProcedure("manage_announcements")
		.input(announcementIdInput)
		.mutation(({ ctx, input }) =>
			transitionAnnouncementStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.announcementId,
				"archived",
			),
		),

	adminTogglePin: organizationPermissionProcedure("manage_announcements")
		.input(togglePinInput)
		.mutation(({ ctx, input }) =>
			toggleAnnouncementPin(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.announcementId,
				input.pinned,
			),
		),

	adminListComments: organizationPermissionProcedure("manage_announcements")
		.input(announcementIdInput)
		.query(({ ctx, input }) =>
			listCommentsForAnnouncementAdmin(
				ctx.organization.organizationId,
				input.announcementId,
			),
		),

	adminSetCommentStatus: organizationPermissionProcedure("manage_announcements")
		.input(setCommentStatusInput)
		.mutation(({ ctx, input }) =>
			setCommentStatus(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input.commentId,
				input.status,
			),
		),
});
