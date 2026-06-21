import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { timestamps } from "./shared";

export const organizationStatusEnum = pgEnum("organization_status", [
	"draft",
	"active",
	"suspended",
	"archived",
]);

export const organizationAdminRoleEnum = pgEnum("organization_admin_role", [
	"owner",
	"admin",
	"membership_manager",
	"finance_manager",
	"content_manager",
	"reviewer",
]);

export const organizationAdminStatusEnum = pgEnum("organization_admin_status", [
	"active",
	"invited",
	"removed",
]);

export const organizations = pgTable(
	"organizations",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		websiteUrl: text("website_url"),
		email: text("email"),
		phone: text("phone"),
		status: organizationStatusEnum("status").notNull().default("draft"),
		createdByUserId: text("created_by_user_id")
			.notNull()
			.references(() => user.id),
		...timestamps,
	},
	(table) => [
		uniqueIndex("organizations_slug_unique").on(table.slug),
		index("organizations_slug_idx").on(table.slug),
		index("organizations_created_by_user_id_idx").on(table.createdByUserId),
	],
);

export const organizationAdmins = pgTable(
	"organization_admins",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: organizationAdminRoleEnum("role").notNull(),
		status: organizationAdminStatusEnum("status").notNull().default("invited"),
		invitedByUserId: text("invited_by_user_id").references(() => user.id),
		...timestamps,
	},
	(table) => [
		uniqueIndex("organization_admins_org_id_user_id_unique").on(
			table.organizationId,
			table.userId,
		),
		index("organization_admins_organization_id_idx").on(table.organizationId),
		index("organization_admins_user_id_idx").on(table.userId),
	],
);

export const organizationRelations = relations(
	organizations,
	({ many, one }) => ({
		creator: one(user, {
			fields: [organizations.createdByUserId],
			references: [user.id],
		}),
		admins: many(organizationAdmins),
	}),
);

export const organizationAdminRelations = relations(
	organizationAdmins,
	({ one }) => ({
		organization: one(organizations, {
			fields: [organizationAdmins.organizationId],
			references: [organizations.id],
		}),
		user: one(user, {
			fields: [organizationAdmins.userId],
			references: [user.id],
		}),
		invitedByUser: one(user, {
			fields: [organizationAdmins.invitedByUserId],
			references: [user.id],
		}),
	}),
);
