import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { membershipApplications } from "./membership";
import { organizations } from "./organization";
import { timestamps } from "./shared";

export const lulafiInboxProcessingStatusEnum = pgEnum(
	"lulafi_inbox_processing_status",
	["pending", "processed", "failed", "unmatched"],
);

export const lulafiInboxMessages = pgTable(
	"lulafi_inbox_messages",
	{
		id: text("id").primaryKey(),
		externalId: text("external_id").notNull(),
		organizationId: text("organization_id").references(() => organizations.id),
		rawPayload: jsonb("raw_payload").$type<unknown>().notNull(),
		processingStatus: lulafiInboxProcessingStatusEnum("processing_status")
			.notNull()
			.default("pending"),
		errorMessage: text("error_message"),
		createdApplicationId: text("created_application_id").references(
			() => membershipApplications.id,
		),
		processedAt: timestamp("processed_at"),
		...timestamps,
	},
	(table) => [
		uniqueIndex("lulafi_inbox_messages_external_id_unique").on(
			table.externalId,
		),
		index("lulafi_inbox_messages_processing_status_idx").on(
			table.processingStatus,
		),
		index("lulafi_inbox_messages_organization_id_idx").on(table.organizationId),
	],
);

export const lulafiInboxMessageRelations = relations(
	lulafiInboxMessages,
	({ one }) => ({
		organization: one(organizations, {
			fields: [lulafiInboxMessages.organizationId],
			references: [organizations.id],
		}),
		createdApplication: one(membershipApplications, {
			fields: [lulafiInboxMessages.createdApplicationId],
			references: [membershipApplications.id],
		}),
	}),
);
