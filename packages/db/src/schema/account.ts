import { relations } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { timestamps } from "./shared";

export const accountRoleEnum = pgEnum("account_role", [
	"member",
	"organization",
	"platform_admin",
]);

export const userProfiles = pgTable("user_profiles", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" })
		.unique(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	phone: text("phone"),
	bio: text("bio"),
	...timestamps,
});

export const accountRoles = pgTable(
	"account_roles",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: accountRoleEnum("role").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("account_roles_user_id_role_unique").on(
			table.userId,
			table.role,
		),
		index("account_roles_user_id_idx").on(table.userId),
	],
);

export const userProfileRelations = relations(userProfiles, ({ one }) => ({
	user: one(user, {
		fields: [userProfiles.userId],
		references: [user.id],
	}),
}));

export const accountRoleRelations = relations(accountRoles, ({ one }) => ({
	user: one(user, {
		fields: [accountRoles.userId],
		references: [user.id],
	}),
}));
