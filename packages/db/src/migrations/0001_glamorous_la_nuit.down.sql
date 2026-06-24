DROP INDEX IF EXISTS "lulafi_inbox_messages_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "lulafi_inbox_messages_processing_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "lulafi_inbox_messages_external_id_unique";
--> statement-breakpoint
ALTER TABLE "lulafi_inbox_messages" DROP CONSTRAINT IF EXISTS "lulafi_inbox_messages_created_application_id_membership_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "lulafi_inbox_messages" DROP CONSTRAINT IF EXISTS "lulafi_inbox_messages_organization_id_organizations_id_fk";
--> statement-breakpoint
DROP TABLE IF EXISTS "lulafi_inbox_messages";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."lulafi_inbox_processing_status";
