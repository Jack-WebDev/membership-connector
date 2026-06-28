CREATE TABLE "lulafi_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"external_event_id" text NOT NULL,
	"source" text NOT NULL,
	"room_id" text,
	"submission_room_id" text,
	"from_user_id" text,
	"from_device_id" text,
	"correlation_id" text,
	"record_id" text,
	"provider_direct_message_room_id" text,
	"display_name" text,
	"form_id" text,
	"form_version" text,
	"form_title" text,
	"raw_payload" jsonb NOT NULL,
	"normalized_payload" jsonb NOT NULL,
	"submitted_at" timestamp,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "lulafi_submissions_external_event_id_unique" ON "lulafi_submissions" USING btree ("external_event_id");--> statement-breakpoint
CREATE INDEX "lulafi_submissions_submitted_at_idx" ON "lulafi_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "lulafi_submissions_received_at_idx" ON "lulafi_submissions" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "lulafi_submissions_from_user_id_idx" ON "lulafi_submissions" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "lulafi_submissions_form_id_idx" ON "lulafi_submissions" USING btree ("form_id");