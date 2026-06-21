CREATE TYPE "public"."account_role" AS ENUM('member', 'organization', 'platform_admin');--> statement-breakpoint
CREATE TYPE "public"."announcement_comment_status" AS ENUM('visible', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."announcement_visibility" AS ENUM('public', 'members_only', 'tier_specific', 'admins_only');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_provider" AS ENUM('manual', 'cash', 'eft', 'demo');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_status" AS ENUM('pending', 'successful', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_type" AS ENUM('membership_payment', 'refund', 'adjustment', 'payout', 'fee');--> statement-breakpoint
CREATE TYPE "public"."membership_application_status" AS ENUM('draft', 'submitted', 'under_review', 'needs_information', 'approved', 'rejected', 'withdrawn', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."membership_member_status" AS ENUM('active', 'pending_payment', 'expired', 'cancelled', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('draft', 'published', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."membership_tier_billing_interval" AS ENUM('free', 'once_off', 'monthly', 'quarterly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."membership_tier_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."membership_visibility" AS ENUM('public', 'private', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."organization_admin_role" AS ENUM('owner', 'admin', 'membership_manager', 'finance_manager', 'content_manager', 'reviewer');--> statement-breakpoint
CREATE TYPE "public"."organization_admin_status" AS ENUM('active', 'invited', 'removed');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('draft', 'active', 'suspended', 'archived');--> statement-breakpoint
CREATE TABLE "account_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "account_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_comment_id" text,
	"body" text NOT NULL,
	"status" "announcement_comment_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"visibility" "announcement_visibility" DEFAULT 'members_only' NOT NULL,
	"status" "announcement_status" DEFAULT 'draft' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"membership_id" text,
	"membership_tier_id" text,
	"user_id" text,
	"type" "finance_transaction_type" NOT NULL,
	"status" "finance_transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'ZAR' NOT NULL,
	"provider" "finance_transaction_provider" NOT NULL,
	"provider_reference" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "finance_transactions_amount_non_negative_check" CHECK ("finance_transactions"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "membership_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"membership_tier_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "membership_application_status" DEFAULT 'draft' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"review_notes" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_members" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"membership_tier_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"application_id" text,
	"status" "membership_member_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'ZAR' NOT NULL,
	"billing_interval" "membership_tier_billing_interval" DEFAULT 'free' NOT NULL,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_members" integer,
	"status" "membership_tier_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tiers_price_non_negative_check" CHECK ("membership_tiers"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"short_description" text,
	"status" "membership_status" DEFAULT 'draft' NOT NULL,
	"visibility" "membership_visibility" DEFAULT 'public' NOT NULL,
	"category" text,
	"application_required" boolean DEFAULT true NOT NULL,
	"public_announcements_enabled" boolean DEFAULT false NOT NULL,
	"members_only_content_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_admins" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "organization_admin_role" NOT NULL,
	"status" "organization_admin_status" DEFAULT 'invited' NOT NULL,
	"invited_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"website_url" text,
	"email" text,
	"phone" text,
	"status" "organization_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_parent_comment_id_announcement_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."announcement_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_membership_tier_id_membership_tiers_id_fk" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_membership_tier_id_membership_tiers_id_fk" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_members" ADD CONSTRAINT "membership_members_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_members" ADD CONSTRAINT "membership_members_membership_tier_id_membership_tiers_id_fk" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_members" ADD CONSTRAINT "membership_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_members" ADD CONSTRAINT "membership_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_members" ADD CONSTRAINT "membership_members_application_id_membership_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."membership_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_tiers" ADD CONSTRAINT "membership_tiers_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_admins" ADD CONSTRAINT "organization_admins_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_admins" ADD CONSTRAINT "organization_admins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_admins" ADD CONSTRAINT "organization_admins_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_memberships" ADD CONSTRAINT "saved_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_memberships" ADD CONSTRAINT "saved_memberships_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_roles_user_id_role_unique" ON "account_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "account_roles_user_id_idx" ON "account_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "announcement_comments_announcement_id_idx" ON "announcement_comments" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "announcement_comments_parent_comment_id_idx" ON "announcement_comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "announcement_likes_announcement_id_user_id_unique" ON "announcement_likes" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE INDEX "announcement_likes_user_id_idx" ON "announcement_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "announcements_membership_id_idx" ON "announcements" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "announcements_organization_id_idx" ON "announcements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "finance_transactions_organization_id_idx" ON "finance_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "finance_transactions_status_idx" ON "finance_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "membership_applications_user_id_idx" ON "membership_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_applications_organization_id_idx" ON "membership_applications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "membership_applications_status_idx" ON "membership_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_applications_active_unique" ON "membership_applications" USING btree ("membership_id","user_id") WHERE "membership_applications"."status" in ('submitted', 'under_review', 'needs_information');--> statement-breakpoint
CREATE INDEX "membership_members_user_id_idx" ON "membership_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_members_organization_id_idx" ON "membership_members" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_members_active_unique" ON "membership_members" USING btree ("membership_id","user_id") WHERE "membership_members"."status" in ('active', 'pending_payment');--> statement-breakpoint
CREATE INDEX "membership_tiers_membership_id_idx" ON "membership_tiers" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_id_slug_unique" ON "memberships" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "memberships_organization_id_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "memberships_slug_idx" ON "memberships" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memberships_visibility_idx" ON "memberships" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_admins_org_id_user_id_unique" ON "organization_admins" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_admins_organization_id_idx" ON "organization_admins" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_admins_user_id_idx" ON "organization_admins" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_created_by_user_id_idx" ON "organizations" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_memberships_user_id_membership_id_unique" ON "saved_memberships" USING btree ("user_id","membership_id");--> statement-breakpoint
CREATE INDEX "saved_memberships_membership_id_idx" ON "saved_memberships" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");