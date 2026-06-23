import { protectedProcedure, router } from "../index";
import {
	countUnreadNotificationsForUser,
	listNotificationsForUser,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "./service";
import { listNotificationsInput, notificationIdInput } from "./types";

export const notificationRouter = router({
	listMine: protectedProcedure
		.input(listNotificationsInput)
		.query(({ ctx, input }) =>
			listNotificationsForUser(ctx.session.user.id, input.limit),
		),

	unreadCount: protectedProcedure.query(({ ctx }) =>
		countUnreadNotificationsForUser(ctx.session.user.id),
	),

	markAsRead: protectedProcedure
		.input(notificationIdInput)
		.mutation(({ ctx, input }) =>
			markNotificationAsRead(ctx.session.user.id, input.notificationId),
		),

	markAllAsRead: protectedProcedure.mutation(({ ctx }) =>
		markAllNotificationsAsRead(ctx.session.user.id),
	),
});
