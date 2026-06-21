import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notifications = pgTable(
	"notifications",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
		readAt: timestamp("read_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("notifications_user_id_idx").on(table.userId),
		index("notifications_read_at_idx").on(table.readAt),
	],
);

export const notificationRelations = relations(notifications, ({ one }) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id],
	}),
}));
