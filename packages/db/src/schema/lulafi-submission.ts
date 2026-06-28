import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const lulafiSubmissions = pgTable(
	"lulafi_submissions",
	{
		id: text("id").primaryKey(),
		externalEventId: text("external_event_id").notNull(),
		source: text("source").notNull(),
		roomId: text("room_id"),
		submissionRoomId: text("submission_room_id"),
		fromUserId: text("from_user_id"),
		fromDeviceId: text("from_device_id"),
		correlationId: text("correlation_id"),
		recordId: text("record_id"),
		providerDirectMessageRoomId: text("provider_direct_message_room_id"),
		displayName: text("display_name"),
		formId: text("form_id"),
		formVersion: text("form_version"),
		formTitle: text("form_title"),
		rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
		normalizedPayload: jsonb("normalized_payload")
			.$type<Record<string, unknown>>()
			.notNull(),
		submittedAt: timestamp("submitted_at"),
		receivedAt: timestamp("received_at").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("lulafi_submissions_external_event_id_unique").on(
			table.externalEventId,
		),
		index("lulafi_submissions_submitted_at_idx").on(table.submittedAt),
		index("lulafi_submissions_received_at_idx").on(table.receivedAt),
		index("lulafi_submissions_from_user_id_idx").on(table.fromUserId),
		index("lulafi_submissions_form_id_idx").on(table.formId),
	],
);
