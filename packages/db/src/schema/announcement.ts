import { relations } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { memberships } from "./membership";
import { organizations } from "./organization";
import { timestamps } from "./shared";

export const announcementVisibilityEnum = pgEnum("announcement_visibility", [
	"public",
	"members_only",
	"tier_specific",
	"admins_only",
]);

export const announcementStatusEnum = pgEnum("announcement_status", [
	"draft",
	"published",
	"archived",
]);

export const announcementCommentStatusEnum = pgEnum(
	"announcement_comment_status",
	["visible", "hidden", "deleted"],
);

export const announcements = pgTable(
	"announcements",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		membershipId: text("membership_id")
			.notNull()
			.references(() => memberships.id, { onDelete: "cascade" }),
		authorUserId: text("author_user_id")
			.notNull()
			.references(() => user.id),
		title: text("title").notNull(),
		body: text("body").notNull(),
		visibility: announcementVisibilityEnum("visibility")
			.notNull()
			.default("members_only"),
		status: announcementStatusEnum("status").notNull().default("draft"),
		pinned: boolean("pinned").notNull().default(false),
		publishedAt: timestamp("published_at"),
		...timestamps,
	},
	(table) => [
		index("announcements_membership_id_idx").on(table.membershipId),
		index("announcements_status_idx").on(table.status),
		index("announcements_organization_id_idx").on(table.organizationId),
	],
);

export const announcementLikes = pgTable(
	"announcement_likes",
	{
		id: text("id").primaryKey(),
		announcementId: text("announcement_id")
			.notNull()
			.references(() => announcements.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("announcement_likes_announcement_id_user_id_unique").on(
			table.announcementId,
			table.userId,
		),
		index("announcement_likes_user_id_idx").on(table.userId),
	],
);

export const announcementComments = pgTable(
	"announcement_comments",
	{
		id: text("id").primaryKey(),
		announcementId: text("announcement_id")
			.notNull()
			.references(() => announcements.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		parentCommentId: text("parent_comment_id").references(
			(): AnyPgColumn => announcementComments.id,
		),
		body: text("body").notNull(),
		status: announcementCommentStatusEnum("status")
			.notNull()
			.default("visible"),
		...timestamps,
	},
	(table) => [
		index("announcement_comments_announcement_id_idx").on(table.announcementId),
		index("announcement_comments_parent_comment_id_idx").on(
			table.parentCommentId,
		),
	],
);

export const announcementRelations = relations(
	announcements,
	({ many, one }) => ({
		organization: one(organizations, {
			fields: [announcements.organizationId],
			references: [organizations.id],
		}),
		membership: one(memberships, {
			fields: [announcements.membershipId],
			references: [memberships.id],
		}),
		authorUser: one(user, {
			fields: [announcements.authorUserId],
			references: [user.id],
		}),
		likes: many(announcementLikes),
		comments: many(announcementComments),
	}),
);

export const announcementLikeRelations = relations(
	announcementLikes,
	({ one }) => ({
		announcement: one(announcements, {
			fields: [announcementLikes.announcementId],
			references: [announcements.id],
		}),
		user: one(user, {
			fields: [announcementLikes.userId],
			references: [user.id],
		}),
	}),
);

export const announcementCommentRelations = relations(
	announcementComments,
	({ many, one }) => ({
		announcement: one(announcements, {
			fields: [announcementComments.announcementId],
			references: [announcements.id],
		}),
		user: one(user, {
			fields: [announcementComments.userId],
			references: [user.id],
		}),
		parentComment: one(announcementComments, {
			fields: [announcementComments.parentCommentId],
			references: [announcementComments.id],
			relationName: "comment_replies",
		}),
		replies: many(announcementComments, {
			relationName: "comment_replies",
		}),
	}),
);
