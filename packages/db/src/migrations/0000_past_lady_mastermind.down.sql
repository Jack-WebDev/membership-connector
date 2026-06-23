DROP INDEX IF EXISTS "organizations_created_by_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "organizations_slug_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "organizations_slug_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "organization_admins_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "organization_admins_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "organization_admins_org_id_user_id_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_read_at_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "saved_memberships_membership_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "saved_memberships_user_id_membership_id_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "memberships_visibility_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "memberships_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "memberships_slug_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "memberships_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "memberships_org_id_slug_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_tiers_membership_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_members_active_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_members_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_members_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_applications_active_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_applications_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_applications_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "membership_applications_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "finance_transactions_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "finance_transactions_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "verification_identifier_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "session_userId_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "account_userId_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "audit_logs_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcements_target_membership_tier_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcements_organization_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcements_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcements_membership_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcement_likes_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcement_likes_announcement_id_user_id_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcement_comments_parent_comment_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "announcement_comments_announcement_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "account_roles_user_id_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "account_roles_user_id_role_unique";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_created_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_admins" DROP CONSTRAINT IF EXISTS "organization_admins_invited_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_admins" DROP CONSTRAINT IF EXISTS "organization_admins_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_admins" DROP CONSTRAINT IF EXISTS "organization_admins_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "saved_memberships" DROP CONSTRAINT IF EXISTS "saved_memberships_membership_id_memberships_id_fk";
--> statement-breakpoint
ALTER TABLE "saved_memberships" DROP CONSTRAINT IF EXISTS "saved_memberships_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT IF EXISTS "memberships_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_tiers" DROP CONSTRAINT IF EXISTS "membership_tiers_membership_id_memberships_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_members" DROP CONSTRAINT IF EXISTS "membership_members_application_id_membership_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_members" DROP CONSTRAINT IF EXISTS "membership_members_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_members" DROP CONSTRAINT IF EXISTS "membership_members_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_members" DROP CONSTRAINT IF EXISTS "membership_members_membership_tier_id_membership_tiers_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_members" DROP CONSTRAINT IF EXISTS "membership_members_membership_id_memberships_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_applications" DROP CONSTRAINT IF EXISTS "membership_applications_reviewed_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_applications" DROP CONSTRAINT IF EXISTS "membership_applications_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_applications" DROP CONSTRAINT IF EXISTS "membership_applications_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_applications" DROP CONSTRAINT IF EXISTS "membership_applications_membership_tier_id_membership_tiers_id_fk";
--> statement-breakpoint
ALTER TABLE "membership_applications" DROP CONSTRAINT IF EXISTS "membership_applications_membership_id_memberships_id_fk";
--> statement-breakpoint
ALTER TABLE "finance_transactions" DROP CONSTRAINT IF EXISTS "finance_transactions_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "finance_transactions" DROP CONSTRAINT IF EXISTS "finance_transactions_membership_tier_id_membership_tiers_id_fk";
--> statement-breakpoint
ALTER TABLE "finance_transactions" DROP CONSTRAINT IF EXISTS "finance_transactions_membership_id_memberships_id_fk";
--> statement-breakpoint
ALTER TABLE "finance_transactions" DROP CONSTRAINT IF EXISTS "finance_transactions_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_target_membership_tier_id_membership_tiers_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_author_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_membership_id_memberships_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement_likes" DROP CONSTRAINT IF EXISTS "announcement_likes_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement_likes" DROP CONSTRAINT IF EXISTS "announcement_likes_announcement_id_announcements_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement_comments" DROP CONSTRAINT IF EXISTS "announcement_comments_parent_comment_id_announcement_comments_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement_comments" DROP CONSTRAINT IF EXISTS "announcement_comments_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "announcement_comments" DROP CONSTRAINT IF EXISTS "announcement_comments_announcement_id_announcements_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "account_roles" DROP CONSTRAINT IF EXISTS "account_roles_user_id_user_id_fk";
--> statement-breakpoint
DROP TABLE IF EXISTS "organizations";
--> statement-breakpoint
DROP TABLE IF EXISTS "organization_admins";
--> statement-breakpoint
DROP TABLE IF EXISTS "notifications";
--> statement-breakpoint
DROP TABLE IF EXISTS "saved_memberships";
--> statement-breakpoint
DROP TABLE IF EXISTS "memberships";
--> statement-breakpoint
DROP TABLE IF EXISTS "membership_tiers";
--> statement-breakpoint
DROP TABLE IF EXISTS "membership_members";
--> statement-breakpoint
DROP TABLE IF EXISTS "membership_applications";
--> statement-breakpoint
DROP TABLE IF EXISTS "finance_transactions";
--> statement-breakpoint
DROP TABLE IF EXISTS "verification";
--> statement-breakpoint
DROP TABLE IF EXISTS "user";
--> statement-breakpoint
DROP TABLE IF EXISTS "session";
--> statement-breakpoint
DROP TABLE IF EXISTS "account";
--> statement-breakpoint
DROP TABLE IF EXISTS "audit_logs";
--> statement-breakpoint
DROP TABLE IF EXISTS "announcements";
--> statement-breakpoint
DROP TABLE IF EXISTS "announcement_likes";
--> statement-breakpoint
DROP TABLE IF EXISTS "announcement_comments";
--> statement-breakpoint
DROP TABLE IF EXISTS "user_profiles";
--> statement-breakpoint
DROP TABLE IF EXISTS "account_roles";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."organization_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."organization_admin_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."organization_admin_role";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."membership_visibility";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."membership_tier_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."membership_tier_billing_interval";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."membership_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."membership_member_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."membership_application_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."finance_transaction_type";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."finance_transaction_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."finance_transaction_provider";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."announcement_visibility";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."announcement_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."announcement_comment_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."account_role";
