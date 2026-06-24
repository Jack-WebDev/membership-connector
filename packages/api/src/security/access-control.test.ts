import { db } from "@membership-connector-app/db";
import { announcementLikes } from "@membership-connector-app/db/schema/announcement";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { appRouter } from "../routers/index";
import {
	addAccountRole,
	addOrganizationAdmin,
	cleanupTestData,
	createFixtureTracker,
	createTestAnnouncement,
	createTestApplication,
	createTestMembership,
	createTestMembershipMember,
	createTestOrganization,
	createTestTier,
	createTestUser,
	type FixtureTracker,
	fakeContext,
} from "../test-utils/db-fixtures";

let tracker: FixtureTracker = createFixtureTracker();

afterEach(async () => {
	await cleanupTestData(tracker);
	tracker = createFixtureTracker();
});

describe("unauthorized and forbidden requests", () => {
	it("rejects an unauthenticated caller on a protected procedure", async () => {
		const caller = appRouter.createCaller(fakeContext(null));

		await expect(caller.notification.listMine({})).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects a caller without the member account role on a member procedure", async () => {
		const userId = await createTestUser(tracker);
		const caller = appRouter.createCaller(fakeContext(userId));

		await expect(
			caller.membershipApplication.listMine({}),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});
});

describe("cross-organization access", () => {
	it("blocks an org admin from accessing a different organization's data", async () => {
		const userA = await createTestUser(tracker);
		const userB = await createTestUser(tracker);
		await createTestOrganization(tracker, userA);
		const { organizationSlug: orgBSlug } = await createTestOrganization(
			tracker,
			userB,
		);

		const callerA = appRouter.createCaller(fakeContext(userA));

		await expect(
			callerA.organization.adminGet({ organizationSlug: orgBSlug }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("blocks a role without the required permission, even within their own org", async () => {
		const owner = await createTestUser(tracker);
		const reviewer = await createTestUser(tracker);
		const { organizationId, organizationSlug } = await createTestOrganization(
			tracker,
			owner,
		);
		await addOrganizationAdmin(organizationId, reviewer, "reviewer");

		const callerReviewer = appRouter.createCaller(fakeContext(reviewer));

		await expect(
			callerReviewer.organization.update({
				organizationSlug,
				name: "Renamed Org",
				description: "",
				websiteUrl: "",
				email: "",
				phone: "",
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});
});

describe("cross-user member access", () => {
	it("blocks a member from reading another member's application", async () => {
		const owner = await createTestUser(tracker);
		const memberA = await createTestUser(tracker);
		const memberB = await createTestUser(tracker);
		await addAccountRole(memberA, "member");
		await addAccountRole(memberB, "member");

		const { organizationId } = await createTestOrganization(tracker, owner);
		const membershipId = await createTestMembership(tracker, organizationId);
		const tierId = await createTestTier(tracker, membershipId);
		const applicationId = await createTestApplication(tracker, {
			membershipId,
			membershipTierId: tierId,
			organizationId,
			userId: memberA,
		});

		const callerB = appRouter.createCaller(fakeContext(memberB));

		await expect(
			callerB.membershipApplication.getMine({ applicationId }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		await expect(
			callerB.membershipApplication.withdraw({ applicationId }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("duplicate prevention", () => {
	it("never leaves more than one like row when toggling repeatedly", async () => {
		const owner = await createTestUser(tracker);
		const member = await createTestUser(tracker);
		await addAccountRole(member, "member");

		const { organizationId } = await createTestOrganization(tracker, owner);
		const membershipId = await createTestMembership(tracker, organizationId);
		const tierId = await createTestTier(tracker, membershipId);
		await createTestMembershipMember(tracker, {
			membershipId,
			membershipTierId: tierId,
			organizationId,
			userId: member,
		});
		const announcementId = await createTestAnnouncement(tracker, {
			organizationId,
			membershipId,
			authorUserId: owner,
			visibility: "members_only",
		});

		const caller = appRouter.createCaller(fakeContext(member));

		await caller.announcement.toggleLike({ announcementId });
		await caller.announcement.toggleLike({ announcementId });

		const afterTwoToggles = await db
			.select()
			.from(announcementLikes)
			.where(eq(announcementLikes.announcementId, announcementId));
		expect(afterTwoToggles).toHaveLength(0);

		await caller.announcement.toggleLike({ announcementId });

		const afterThreeToggles = await db
			.select()
			.from(announcementLikes)
			.where(eq(announcementLikes.announcementId, announcementId));
		expect(afterThreeToggles).toHaveLength(1);
	});

	it("rejects a second active application for the same membership", async () => {
		const owner = await createTestUser(tracker);
		const member = await createTestUser(tracker);
		await addAccountRole(member, "member");

		const { organizationId } = await createTestOrganization(tracker, owner);
		const membershipId = await createTestMembership(tracker, organizationId);
		const tierId = await createTestTier(tracker, membershipId);
		await createTestApplication(tracker, {
			membershipId,
			membershipTierId: tierId,
			organizationId,
			userId: member,
			status: "submitted",
		});

		const caller = appRouter.createCaller(fakeContext(member));

		await expect(
			caller.membershipApplication.submit({
				membershipId,
				membershipTierId: tierId,
				answers: {
					applicantName: "Test Applicant",
					applicantEmail: "applicant@example.test",
					reason: "I would like to join",
					agreement: true,
				},
			}),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});
});

describe("audit logging for sensitive actions", () => {
	it("records an audit log when an organization owner updates settings", async () => {
		const owner = await createTestUser(tracker);
		const { organizationId, organizationSlug } = await createTestOrganization(
			tracker,
			owner,
		);

		const caller = appRouter.createCaller(fakeContext(owner));

		await caller.organization.update({
			organizationSlug,
			name: "Renamed Org",
			description: "",
			websiteUrl: "",
			email: "",
			phone: "",
		});

		const log = await db.query.auditLogs.findFirst({
			where: and(
				eq(auditLogs.organizationId, organizationId),
				eq(auditLogs.action, "organization.updated"),
			),
		});

		expect(log).toBeDefined();
		expect(log?.actorUserId).toBe(owner);
	});

	it("records an audit log when a member likes an announcement", async () => {
		const owner = await createTestUser(tracker);
		const member = await createTestUser(tracker);
		await addAccountRole(member, "member");

		const { organizationId } = await createTestOrganization(tracker, owner);
		const membershipId = await createTestMembership(tracker, organizationId);
		const tierId = await createTestTier(tracker, membershipId);
		await createTestMembershipMember(tracker, {
			membershipId,
			membershipTierId: tierId,
			organizationId,
			userId: member,
		});
		const announcementId = await createTestAnnouncement(tracker, {
			organizationId,
			membershipId,
			authorUserId: owner,
			visibility: "members_only",
		});

		const caller = appRouter.createCaller(fakeContext(member));
		await caller.announcement.toggleLike({ announcementId });

		const log = await db.query.auditLogs.findFirst({
			where: and(
				eq(auditLogs.organizationId, organizationId),
				eq(auditLogs.action, "announcement.liked"),
			),
		});

		expect(log).toBeDefined();
		expect(log?.entityId).toBe(announcementId);
	});
});

describe("error propagation sanity check", () => {
	it("throws real TRPCError instances, not generic errors", async () => {
		const caller = appRouter.createCaller(fakeContext(null));

		await expect(caller.notification.listMine({})).rejects.toBeInstanceOf(
			TRPCError,
		);
	});
});
