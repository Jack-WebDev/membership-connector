import { sql } from "drizzle-orm";
import { closeDb, db } from "../index";
import { seedAccountRoles, seedUserProfiles } from "./account";
import { seedAnnouncementEngagement, seedAnnouncements } from "./announcement";
import { seedAuditLogs } from "./audit";
import { seedAuthUsers } from "./auth";
import { adminDefs, memberDefs, ownerDefs } from "./data";
import { seedFinanceTransactions } from "./finance";
import { seedLulafiSubmissions } from "./lulafi-submission";
import {
	seedApplicationsAndMembers,
	seedCategories,
	seedMemberships,
	seedSavedMemberships,
	seedTiers,
} from "./membership";
import { seedNotifications } from "./notification";
import { seedOrganizationAdmins, seedOrganizations } from "./organization";

async function truncateAll(): Promise<void> {
	await db.execute(sql`
		TRUNCATE TABLE
			audit_logs,
			lulafi_submissions,
			notifications,
			finance_transactions,
			announcement_comments,
			announcement_likes,
			announcements,
			saved_memberships,
			membership_members,
			membership_applications,
			membership_tiers,
			memberships,
			categories,
			organization_admins,
			organizations,
			account_roles,
			user_profiles,
			session,
			account,
			verification,
			"user"
		RESTART IDENTITY CASCADE
	`);
}

async function main() {
	console.info("Truncating existing data...");
	await truncateAll();

	console.info("Creating users...");
	const ownerIds = await seedAuthUsers(ownerDefs);
	const adminIds = await seedAuthUsers(adminDefs);
	const memberIds = await seedAuthUsers(memberDefs);

	await seedAccountRoles(memberIds, "member");
	await seedAccountRoles(ownerIds, "organization");
	await seedAccountRoles(adminIds, "organization");

	await seedUserProfiles(ownerIds, ownerDefs);
	await seedUserProfiles(adminIds, adminDefs);
	await seedUserProfiles(memberIds, memberDefs);

	console.info("Creating organizations...");
	const orgIds = await seedOrganizations(ownerIds);
	await seedOrganizationAdmins(orgIds, ownerIds, adminIds);

	console.info("Creating categories, memberships, and tiers...");
	const categoryIds = await seedCategories();
	const membershipIds = await seedMemberships(orgIds, categoryIds);
	const tierIds = await seedTiers(membershipIds);

	console.info("Creating applications and memberships...");
	const { activeMemberships, paidApprovals } = await seedApplicationsAndMembers(
		orgIds,
		membershipIds,
		tierIds,
		memberIds,
		ownerIds,
	);
	await seedSavedMemberships(memberIds, membershipIds);

	console.info("Creating announcements, likes, and comments...");
	const announcementIds = await seedAnnouncements(
		orgIds,
		membershipIds,
		tierIds,
		ownerIds,
		adminIds,
	);
	await seedAnnouncementEngagement(
		activeMemberships,
		memberIds,
		announcementIds,
	);

	console.info("Recording finance transactions...");
	await seedFinanceTransactions(
		orgIds,
		membershipIds,
		tierIds,
		memberIds,
		paidApprovals,
	);

	console.info("Creating notifications, audit logs, and lulafi submissions...");
	await seedNotifications(memberIds);
	await seedAuditLogs(orgIds, ownerIds);
	await seedLulafiSubmissions();

	console.info("Seed data created successfully.");
	console.info(`Active memberships created: ${activeMemberships.length}`);
}

main()
	.then(async () => {
		await closeDb();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error("Seed script failed:", error);
		await closeDb();
		process.exit(1);
	});
