import { db } from "@membership-connector-app/db";
import { accountRoles } from "@membership-connector-app/db/schema/account";
import {
	announcementComments,
	announcementLikes,
	announcements,
} from "@membership-connector-app/db/schema/announcement";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import { user } from "@membership-connector-app/db/schema/auth";
import { lulafiSubmissions } from "@membership-connector-app/db/schema/lulafi-submission";
import {
	categories,
	membershipApplications,
	membershipMembers,
	memberships,
	membershipTiers,
} from "@membership-connector-app/db/schema/membership";
import {
	organizationAdmins,
	organizations,
} from "@membership-connector-app/db/schema/organization";
import { inArray } from "drizzle-orm";

import type { OrganizationAdminRole } from "../account-access";
import type { Context } from "../context";

export type FixtureTracker = {
	userIds: string[];
	organizationIds: string[];
	categoryIds: string[];
	membershipIds: string[];
	membershipTierIds: string[];
	applicationIds: string[];
	membershipMemberIds: string[];
	announcementIds: string[];
	lulafiSubmissionIds: string[];
};

export function createFixtureTracker(): FixtureTracker {
	return {
		userIds: [],
		organizationIds: [],
		categoryIds: [],
		membershipIds: [],
		membershipTierIds: [],
		applicationIds: [],
		membershipMemberIds: [],
		announcementIds: [],
		lulafiSubmissionIds: [],
	};
}

export async function createTestUser(
	tracker: FixtureTracker,
	overrides?: { name?: string },
): Promise<string> {
	const userId = crypto.randomUUID();

	await db.insert(user).values({
		id: userId,
		name: overrides?.name ?? "Test User",
		email: `test-${userId}@example.test`,
		emailVerified: true,
	});

	tracker.userIds.push(userId);
	return userId;
}

export async function addAccountRole(
	userId: string,
	role: "member" | "organization" | "platform_admin",
): Promise<void> {
	await db.insert(accountRoles).values({
		id: crypto.randomUUID(),
		userId,
		role,
	});
}

export async function createTestOrganization(
	tracker: FixtureTracker,
	ownerUserId: string,
): Promise<{ organizationId: string; organizationSlug: string }> {
	const organizationId = crypto.randomUUID();
	const organizationSlug = `org-${organizationId}`;

	await db.insert(organizations).values({
		id: organizationId,
		name: "Test Organization",
		slug: organizationSlug,
		status: "active",
		createdByUserId: ownerUserId,
	});

	await db.insert(organizationAdmins).values({
		id: crypto.randomUUID(),
		organizationId,
		userId: ownerUserId,
		role: "owner",
		status: "active",
	});

	tracker.organizationIds.push(organizationId);
	return { organizationId, organizationSlug };
}

export async function addOrganizationAdmin(
	organizationId: string,
	userId: string,
	role: OrganizationAdminRole,
	status: "active" | "invited" | "removed" = "active",
): Promise<void> {
	await db.insert(organizationAdmins).values({
		id: crypto.randomUUID(),
		organizationId,
		userId,
		role,
		status,
	});
}

export async function createTestMembership(
	tracker: FixtureTracker,
	organizationId: string,
	overrides?: {
		status?: "draft" | "published" | "paused" | "archived";
		visibility?: "public" | "private" | "invite_only";
	},
): Promise<string> {
	const membershipId = crypto.randomUUID();
	const categoryId = crypto.randomUUID();

	await db.insert(categories).values({
		id: categoryId,
		slug: `category-${categoryId}`,
		name: "Test Category",
	});

	await db.insert(memberships).values({
		id: membershipId,
		organizationId,
		categoryId,
		name: "Test Membership",
		slug: `membership-${membershipId}`,
		status: overrides?.status ?? "published",
		visibility: overrides?.visibility ?? "public",
	});

	tracker.categoryIds.push(categoryId);
	tracker.membershipIds.push(membershipId);
	return membershipId;
}

export async function createTestTier(
	tracker: FixtureTracker,
	membershipId: string,
	overrides?: { status?: "active" | "inactive" | "archived" },
): Promise<string> {
	const tierId = crypto.randomUUID();

	await db.insert(membershipTiers).values({
		id: tierId,
		membershipId,
		name: "Test Tier",
		price: "0.00",
		currency: "ZAR",
		billingInterval: "free",
		status: overrides?.status ?? "active",
	});

	tracker.membershipTierIds.push(tierId);
	return tierId;
}

export async function createTestApplication(
	tracker: FixtureTracker,
	params: {
		membershipId: string;
		membershipTierId: string;
		organizationId: string;
		userId: string;
		status?:
			| "draft"
			| "submitted"
			| "under_review"
			| "needs_information"
			| "approved"
			| "rejected"
			| "withdrawn"
			| "cancelled";
	},
): Promise<string> {
	const applicationId = crypto.randomUUID();

	await db.insert(membershipApplications).values({
		id: applicationId,
		membershipId: params.membershipId,
		membershipTierId: params.membershipTierId,
		organizationId: params.organizationId,
		userId: params.userId,
		status: params.status ?? "submitted",
		submittedAt: new Date(),
	});

	tracker.applicationIds.push(applicationId);
	return applicationId;
}

export async function createTestMembershipMember(
	tracker: FixtureTracker,
	params: {
		membershipId: string;
		membershipTierId: string;
		organizationId: string;
		userId: string;
		status?:
			| "active"
			| "pending_payment"
			| "expired"
			| "cancelled"
			| "suspended";
	},
): Promise<string> {
	const memberId = crypto.randomUUID();

	await db.insert(membershipMembers).values({
		id: memberId,
		membershipId: params.membershipId,
		membershipTierId: params.membershipTierId,
		organizationId: params.organizationId,
		userId: params.userId,
		status: params.status ?? "active",
	});

	tracker.membershipMemberIds.push(memberId);
	return memberId;
}

export async function createTestAnnouncement(
	tracker: FixtureTracker,
	params: {
		organizationId: string;
		membershipId: string;
		authorUserId: string;
		visibility?: "public" | "members_only" | "tier_specific" | "admins_only";
		status?: "draft" | "published" | "archived";
		targetMembershipTierId?: string;
	},
): Promise<string> {
	const announcementId = crypto.randomUUID();

	await db.insert(announcements).values({
		id: announcementId,
		organizationId: params.organizationId,
		membershipId: params.membershipId,
		authorUserId: params.authorUserId,
		title: "Test Announcement",
		body: "Test announcement body",
		visibility: params.visibility ?? "members_only",
		status: params.status ?? "published",
		publishedAt: new Date(),
		targetMembershipTierId: params.targetMembershipTierId,
	});

	tracker.announcementIds.push(announcementId);
	return announcementId;
}

export async function createTestLulafiSubmission(
	tracker: FixtureTracker,
	overrides?: {
		externalEventId?: string;
		displayName?: string | null;
		formId?: string | null;
		formTitle?: string | null;
	},
): Promise<string> {
	const submissionId = crypto.randomUUID();

	await db.insert(lulafiSubmissions).values({
		id: submissionId,
		externalEventId:
			overrides?.externalEventId ?? `event-${crypto.randomUUID()}`,
		source: "lulafi-chat",
		roomId: "room-1",
		submissionRoomId: "submission-room-1",
		fromUserId: "user-1",
		fromDeviceId: "device-1",
		correlationId: "corr-1",
		recordId: "record-1",
		providerDirectMessageRoomId: "dm-room-1",
		displayName: overrides?.displayName ?? "Test Sender",
		formId: overrides?.formId ?? "form-1",
		formVersion: "1",
		formTitle: overrides?.formTitle ?? "Test Form",
		rawPayload: { source: "raw" },
		normalizedPayload: {
			source: "readable",
			fields: [{ key: "field-1", label: "Field 1", value: "Value 1" }],
		},
		submittedAt: new Date(),
		receivedAt: new Date(),
	});

	tracker.lulafiSubmissionIds.push(submissionId);
	return submissionId;
}

export function fakeSession(userId: string): Context["session"] {
	return { user: { id: userId } } as unknown as Context["session"];
}

export function fakeContext(userId: string | null): Context {
	return {
		auth: null,
		session: userId === null ? null : fakeSession(userId),
	};
}

export async function cleanupTestData(tracker: FixtureTracker): Promise<void> {
	if (tracker.organizationIds.length > 0) {
		await db
			.delete(auditLogs)
			.where(inArray(auditLogs.organizationId, tracker.organizationIds));
	}

	if (tracker.lulafiSubmissionIds.length > 0) {
		await db
			.delete(lulafiSubmissions)
			.where(inArray(lulafiSubmissions.id, tracker.lulafiSubmissionIds));
	}

	if (tracker.announcementIds.length > 0) {
		await db
			.delete(announcementComments)
			.where(
				inArray(announcementComments.announcementId, tracker.announcementIds),
			);
		await db
			.delete(announcementLikes)
			.where(
				inArray(announcementLikes.announcementId, tracker.announcementIds),
			);
		await db
			.delete(announcements)
			.where(inArray(announcements.id, tracker.announcementIds));
	}

	if (tracker.organizationIds.length > 0) {
		await db
			.delete(membershipMembers)
			.where(
				inArray(membershipMembers.organizationId, tracker.organizationIds),
			);
	}

	if (tracker.applicationIds.length > 0) {
		await db
			.delete(membershipApplications)
			.where(inArray(membershipApplications.id, tracker.applicationIds));
	}

	if (tracker.organizationIds.length > 0) {
		await db
			.delete(membershipApplications)
			.where(
				inArray(membershipApplications.organizationId, tracker.organizationIds),
			);
	}

	if (tracker.membershipTierIds.length > 0) {
		await db
			.delete(membershipTiers)
			.where(inArray(membershipTiers.id, tracker.membershipTierIds));
	}

	if (tracker.membershipIds.length > 0) {
		await db
			.delete(memberships)
			.where(inArray(memberships.id, tracker.membershipIds));
	}

	if (tracker.categoryIds.length > 0) {
		await db
			.delete(categories)
			.where(inArray(categories.id, tracker.categoryIds));
	}

	if (tracker.organizationIds.length > 0) {
		await db
			.delete(organizationAdmins)
			.where(
				inArray(organizationAdmins.organizationId, tracker.organizationIds),
			);
		await db
			.delete(organizations)
			.where(inArray(organizations.id, tracker.organizationIds));
	}

	if (tracker.userIds.length > 0) {
		await db
			.delete(accountRoles)
			.where(inArray(accountRoles.userId, tracker.userIds));
		await db.delete(user).where(inArray(user.id, tracker.userIds));
	}
}
