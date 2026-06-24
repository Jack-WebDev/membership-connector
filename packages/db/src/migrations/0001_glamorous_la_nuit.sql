CREATE TYPE "public"."lulafi_inbox_processing_status" AS ENUM('pending', 'processed', 'failed', 'unmatched');--> statement-breakpoint
CREATE TABLE "lulafi_inbox_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"organization_id" text,
	"raw_payload" jsonb NOT NULL,
	"processing_status" "lulafi_inbox_processing_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_application_id" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lulafi_inbox_messages" ADD CONSTRAINT "lulafi_inbox_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lulafi_inbox_messages" ADD CONSTRAINT "lulafi_inbox_messages_created_application_id_membership_applications_id_fk" FOREIGN KEY ("created_application_id") REFERENCES "public"."membership_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lulafi_inbox_messages_external_id_unique" ON "lulafi_inbox_messages" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "lulafi_inbox_messages_processing_status_idx" ON "lulafi_inbox_messages" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "lulafi_inbox_messages_organization_id_idx" ON "lulafi_inbox_messages" USING btree ("organization_id");