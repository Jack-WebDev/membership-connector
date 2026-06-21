import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organization";

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id),
		actorUserId: text("actor_user_id").references(() => user.id),
		action: text("action").notNull(),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		metadata: jsonb("metadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("audit_logs_organization_id_idx").on(table.organizationId)],
);

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
	organization: one(organizations, {
		fields: [auditLogs.organizationId],
		references: [organizations.id],
	}),
	actorUser: one(user, {
		fields: [auditLogs.actorUserId],
		references: [user.id],
	}),
}));
