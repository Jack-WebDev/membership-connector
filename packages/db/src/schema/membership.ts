import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organization";
import { timestamps } from "./shared";

export const membershipStatusEnum = pgEnum("membership_status", [
	"draft",
	"published",
	"paused",
	"archived",
]);

export const membershipVisibilityEnum = pgEnum("membership_visibility", [
	"public",
	"private",
	"invite_only",
]);

export const membershipTierBillingIntervalEnum = pgEnum(
	"membership_tier_billing_interval",
	["free", "once_off", "monthly", "quarterly", "yearly", "custom"],
);

export const membershipTierStatusEnum = pgEnum("membership_tier_status", [
	"active",
	"inactive",
	"archived",
]);

export const membershipApplicationStatusEnum = pgEnum(
	"membership_application_status",
	[
		"draft",
		"submitted",
		"under_review",
		"needs_information",
		"approved",
		"rejected",
		"withdrawn",
		"cancelled",
	],
);

export const membershipMemberStatusEnum = pgEnum("membership_member_status", [
	"active",
	"pending_payment",
	"expired",
	"cancelled",
	"suspended",
]);

export const memberships = pgTable(
	"memberships",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		shortDescription: text("short_description"),
		status: membershipStatusEnum("status").notNull().default("draft"),
		visibility: membershipVisibilityEnum("visibility")
			.notNull()
			.default("public"),
		category: text("category"),
		applicationRequired: boolean("application_required")
			.notNull()
			.default(true),
		publicAnnouncementsEnabled: boolean("public_announcements_enabled")
			.notNull()
			.default(false),
		membersOnlyContentEnabled: boolean("members_only_content_enabled")
			.notNull()
			.default(false),
		...timestamps,
	},
	(table) => [
		uniqueIndex("memberships_org_id_slug_unique").on(
			table.organizationId,
			table.slug,
		),
		index("memberships_organization_id_idx").on(table.organizationId),
		index("memberships_slug_idx").on(table.slug),
		index("memberships_status_idx").on(table.status),
		index("memberships_visibility_idx").on(table.visibility),
	],
);

export const membershipTiers = pgTable(
	"membership_tiers",
	{
		id: text("id").primaryKey(),
		membershipId: text("membership_id")
			.notNull()
			.references(() => memberships.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		price: numeric("price", { precision: 12, scale: 2 }).notNull(),
		currency: text("currency").notNull().default("ZAR"),
		billingInterval: membershipTierBillingIntervalEnum("billing_interval")
			.notNull()
			.default("free"),
		benefits: jsonb("benefits").$type<unknown[]>().notNull().default([]),
		requirements: jsonb("requirements")
			.$type<unknown[]>()
			.notNull()
			.default([]),
		maxMembers: integer("max_members"),
		status: membershipTierStatusEnum("status").notNull().default("active"),
		sortOrder: integer("sort_order").notNull().default(0),
		...timestamps,
	},
	(table) => [
		index("membership_tiers_membership_id_idx").on(table.membershipId),
		check(
			"membership_tiers_price_non_negative_check",
			sql`${table.price} >= 0`,
		),
	],
);

export const membershipApplications = pgTable(
	"membership_applications",
	{
		id: text("id").primaryKey(),
		membershipId: text("membership_id")
			.notNull()
			.references(() => memberships.id),
		membershipTierId: text("membership_tier_id")
			.notNull()
			.references(() => membershipTiers.id),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: membershipApplicationStatusEnum("status")
			.notNull()
			.default("draft"),
		answers: jsonb("answers")
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),
		reviewNotes: text("review_notes"),
		submittedAt: timestamp("submitted_at"),
		reviewedAt: timestamp("reviewed_at"),
		reviewedByUserId: text("reviewed_by_user_id").references(() => user.id),
		...timestamps,
	},
	(table) => [
		index("membership_applications_user_id_idx").on(table.userId),
		index("membership_applications_organization_id_idx").on(
			table.organizationId,
		),
		index("membership_applications_status_idx").on(table.status),
		uniqueIndex("membership_applications_active_unique")
			.on(table.membershipId, table.userId)
			.where(
				sql`${table.status} in ('submitted', 'under_review', 'needs_information')`,
			),
	],
);

export const membershipMembers = pgTable(
	"membership_members",
	{
		id: text("id").primaryKey(),
		membershipId: text("membership_id")
			.notNull()
			.references(() => memberships.id),
		membershipTierId: text("membership_tier_id")
			.notNull()
			.references(() => membershipTiers.id),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		applicationId: text("application_id").references(
			() => membershipApplications.id,
		),
		status: membershipMemberStatusEnum("status").notNull().default("active"),
		startedAt: timestamp("started_at").notNull().defaultNow(),
		expiresAt: timestamp("expires_at"),
		cancelledAt: timestamp("cancelled_at"),
		notes: text("notes"),
		...timestamps,
	},
	(table) => [
		index("membership_members_user_id_idx").on(table.userId),
		index("membership_members_organization_id_idx").on(table.organizationId),
		uniqueIndex("membership_members_active_unique")
			.on(table.membershipId, table.userId)
			.where(sql`${table.status} in ('active', 'pending_payment')`),
	],
);

export const savedMemberships = pgTable(
	"saved_memberships",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		membershipId: text("membership_id")
			.notNull()
			.references(() => memberships.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("saved_memberships_user_id_membership_id_unique").on(
			table.userId,
			table.membershipId,
		),
		index("saved_memberships_membership_id_idx").on(table.membershipId),
	],
);

export const membershipRelations = relations(memberships, ({ many, one }) => ({
	organization: one(organizations, {
		fields: [memberships.organizationId],
		references: [organizations.id],
	}),
	tiers: many(membershipTiers),
	applications: many(membershipApplications),
	members: many(membershipMembers),
	savedByUsers: many(savedMemberships),
}));

export const membershipTierRelations = relations(
	membershipTiers,
	({ many, one }) => ({
		membership: one(memberships, {
			fields: [membershipTiers.membershipId],
			references: [memberships.id],
		}),
		applications: many(membershipApplications),
		members: many(membershipMembers),
	}),
);

export const membershipApplicationRelations = relations(
	membershipApplications,
	({ many, one }) => ({
		membership: one(memberships, {
			fields: [membershipApplications.membershipId],
			references: [memberships.id],
		}),
		membershipTier: one(membershipTiers, {
			fields: [membershipApplications.membershipTierId],
			references: [membershipTiers.id],
		}),
		organization: one(organizations, {
			fields: [membershipApplications.organizationId],
			references: [organizations.id],
		}),
		user: one(user, {
			fields: [membershipApplications.userId],
			references: [user.id],
		}),
		reviewedByUser: one(user, {
			fields: [membershipApplications.reviewedByUserId],
			references: [user.id],
		}),
		memberships: many(membershipMembers),
	}),
);

export const membershipMemberRelations = relations(
	membershipMembers,
	({ one }) => ({
		membership: one(memberships, {
			fields: [membershipMembers.membershipId],
			references: [memberships.id],
		}),
		membershipTier: one(membershipTiers, {
			fields: [membershipMembers.membershipTierId],
			references: [membershipTiers.id],
		}),
		organization: one(organizations, {
			fields: [membershipMembers.organizationId],
			references: [organizations.id],
		}),
		user: one(user, {
			fields: [membershipMembers.userId],
			references: [user.id],
		}),
		application: one(membershipApplications, {
			fields: [membershipMembers.applicationId],
			references: [membershipApplications.id],
		}),
	}),
);

export const savedMembershipRelations = relations(
	savedMemberships,
	({ one }) => ({
		user: one(user, {
			fields: [savedMemberships.userId],
			references: [user.id],
		}),
		membership: one(memberships, {
			fields: [savedMemberships.membershipId],
			references: [memberships.id],
		}),
	}),
);
