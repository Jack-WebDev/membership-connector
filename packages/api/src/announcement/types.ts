import { z } from "zod";

export const membershipIdInput = z.object({
	membershipId: z.string().trim().min(1),
});
export type MembershipIdInput = z.infer<typeof membershipIdInput>;

export const announcementIdInput = z.object({
	announcementId: z.string().trim().min(1),
});
export type AnnouncementIdInput = z.infer<typeof announcementIdInput>;

export const commentIdInput = z.object({
	commentId: z.string().trim().min(1),
});
export type CommentIdInput = z.infer<typeof commentIdInput>;

const announcementVisibilityValues = [
	"public",
	"members_only",
	"tier_specific",
	"admins_only",
] as const;
export type AnnouncementVisibility =
	(typeof announcementVisibilityValues)[number];

const announcementStatusValues = ["draft", "published", "archived"] as const;
export type AnnouncementStatus = (typeof announcementStatusValues)[number];

const announcementEditableFields = {
	membershipId: z.string().trim().min(1),
	title: z.string().trim().min(2, "Title is required").max(200),
	body: z.string().trim().min(1, "Body is required").max(8000),
	visibility: z.enum(announcementVisibilityValues),
	targetMembershipTierId: z.string().trim().min(1).optional(),
};

export const createAnnouncementInput = z.object(announcementEditableFields);
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementInput>;

export const updateAnnouncementInput = z.object({
	announcementId: z.string().trim().min(1),
	...announcementEditableFields,
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementInput>;

export const togglePinInput = z.object({
	announcementId: z.string().trim().min(1),
	pinned: z.boolean(),
});
export type TogglePinInput = z.infer<typeof togglePinInput>;

export const listAdminAnnouncementsInput = z.object({
	search: z.string().trim().max(160).optional(),
	status: z.enum(announcementStatusValues).optional(),
	visibility: z.enum(announcementVisibilityValues).optional(),
	membershipId: z.string().trim().min(1).optional(),
	pinned: z.coerce.boolean().optional(),
	sortBy: z.enum(["updatedAt", "title"]).default("updatedAt"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminAnnouncementsInput = z.infer<
	typeof listAdminAnnouncementsInput
>;

export const addCommentInput = z.object({
	announcementId: z.string().trim().min(1),
	body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
	parentCommentId: z.string().trim().min(1).optional(),
});
export type AddCommentInput = z.infer<typeof addCommentInput>;

const commentStatusValues = ["visible", "hidden"] as const;

export const setCommentStatusInput = z.object({
	commentId: z.string().trim().min(1),
	status: z.enum(commentStatusValues),
});
export type SetCommentStatusInput = z.infer<typeof setCommentStatusInput>;

export type MemberAnnouncementSummary = {
	id: string;
	title: string;
	body: string;
	authorName: string;
	publishedAt: Date;
	pinned: boolean;
	visibilityLabel: string;
	likesCount: number;
	commentsCount: number;
	likedByMe: boolean;
};

export type MemberCommentSummary = {
	id: string;
	authorUserId: string;
	authorName: string;
	body: string;
	status: "visible" | "hidden" | "deleted";
	createdAt: Date;
	parentCommentId: string | null;
};

export type AdminAnnouncementSummary = {
	id: string;
	title: string;
	status: AnnouncementStatus;
	visibility: AnnouncementVisibility;
	membershipId: string;
	membershipName: string;
	pinned: boolean;
	likesCount: number;
	commentsCount: number;
	publishedAt: Date | null;
	updatedAt: Date;
};

export type AdminAnnouncementDetail = AdminAnnouncementSummary & {
	body: string;
	targetMembershipTierId: string | null;
	targetTierName: string | null;
	createdAt: Date;
};

export type AdminAnnouncementFilterOptions = {
	memberships: { id: string; name: string }[];
};

export type AdminCommentSummary = {
	id: string;
	authorUserId: string;
	authorName: string;
	body: string;
	status: "visible" | "hidden" | "deleted";
	createdAt: Date;
	parentCommentId: string | null;
};
