import { db } from "@membership-connector-app/db";
import {
	membershipApplications,
	membershipMembers,
	memberships,
	membershipTiers,
} from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne } from "drizzle-orm";

import { recordAuditLog } from "../audit-log/service";
import {
	createNotification,
	notifyOrganizationAdmins,
} from "../notification/service";
import type {
	AdminApplicationDetail,
	AdminApplicationFilterOptions,
	AdminApplicationSummary,
	ApplicationAnswersInput,
	ListAdminApplicationsInput,
	ListMemberApplicationsInput,
	MemberApplicationDetail,
	MemberApplicationSummary,
	MemberMembershipStatusInfo,
	RespondToInformationRequestInput,
	SaveApplicationDraftInput,
	SubmitApplicationInput,
} from "./types";

const ACTIVE_APPLICATION_STATUSES = [
	"submitted",
	"under_review",
	"needs_information",
] as const;
const ACTIVE_MEMBER_STATUSES = ["active", "pending_payment"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findApplicableMembershipAndTier(
	executor: DbExecutor,
	membershipId: string,
	membershipTierId: string,
) {
	const membership = await executor.query.memberships.findFirst({
		where: eq(memberships.id, membershipId),
		with: { organization: true },
	});

	if (!membership) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Membership not found",
		});
	}

	if (membership.organization.status !== "active") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This organization is not currently active",
		});
	}

	if (membership.visibility !== "public") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "This membership does not accept public applications",
		});
	}

	if (membership.status !== "published") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This membership is not currently accepting applications",
		});
	}

	const tier = await executor.query.membershipTiers.findFirst({
		where: eq(membershipTiers.id, membershipTierId),
	});

	if (!tier || tier.membershipId !== membershipId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
	}

	if (tier.status !== "active") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This tier is not currently available",
		});
	}

	return { membership, tier };
}

function assertAnswersReadyForSubmission(answers: ApplicationAnswersInput) {
	if (answers.applicantName.trim().length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Applicant name is required",
		});
	}

	if (!EMAIL_PATTERN.test(answers.applicantEmail)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A valid applicant email is required",
		});
	}

	if (answers.reason.trim().length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A reason for applying is required",
		});
	}

	if (!answers.agreement) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "You must accept the agreement to submit",
		});
	}
}

async function assertNoConflictingApplicationOrMembership(
	executor: DbExecutor,
	userId: string,
	membershipId: string,
	membershipTierId: string,
	excludeApplicationId?: string,
) {
	const activeApplication =
		await executor.query.membershipApplications.findFirst({
			where: and(
				eq(membershipApplications.membershipId, membershipId),
				eq(membershipApplications.userId, userId),
				inArray(membershipApplications.status, ACTIVE_APPLICATION_STATUSES),
				...(excludeApplicationId
					? [ne(membershipApplications.id, excludeApplicationId)]
					: []),
			),
		});

	if (activeApplication) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "You already have an active application for this membership",
		});
	}

	const activeMembership = await executor.query.membershipMembers.findFirst({
		where: and(
			eq(membershipMembers.membershipId, membershipId),
			eq(membershipMembers.userId, userId),
			inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
		),
	});

	// An active member may apply for a different tier to request an upgrade;
	// approving it updates their existing membership instead of conflicting.
	if (
		activeMembership &&
		activeMembership.membershipTierId === membershipTierId
	) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "You already have an active membership at this tier",
		});
	}
}

async function findOwnedApplicationOrThrow(
	executor: DbExecutor,
	userId: string,
	applicationId: string,
) {
	const application = await executor.query.membershipApplications.findFirst({
		where: and(
			eq(membershipApplications.id, applicationId),
			eq(membershipApplications.userId, userId),
		),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
	});

	if (!application) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Application not found",
		});
	}

	return application;
}

type ApplicationWithRelations = Awaited<
	ReturnType<typeof findOwnedApplicationOrThrow>
>;

function toSummary(row: ApplicationWithRelations): MemberApplicationSummary {
	return {
		id: row.id,
		status: row.status,
		membershipId: row.membershipId,
		membershipName: row.membership.name,
		membershipSlug: row.membership.slug,
		organizationName: row.membership.organization.name,
		organizationSlug: row.membership.organization.slug,
		tierName: row.membershipTier.name,
		submittedAt: row.submittedAt,
		updatedAt: row.updatedAt,
	};
}

function toDetail(row: ApplicationWithRelations): MemberApplicationDetail {
	return {
		...toSummary(row),
		membershipTierId: row.membershipTierId,
		answers: row.answers,
		reviewNotes: row.reviewNotes,
		reviewedAt: row.reviewedAt,
		createdAt: row.createdAt,
	};
}

export async function saveApplicationDraft(
	userId: string,
	input: SaveApplicationDraftInput,
): Promise<{ applicationId: string }> {
	return db.transaction(async (tx) => {
		const { membership } = await findApplicableMembershipAndTier(
			tx,
			input.membershipId,
			input.membershipTierId,
		);

		if (input.applicationId) {
			const existing = await findOwnedApplicationOrThrow(
				tx,
				userId,
				input.applicationId,
			);

			if (existing.status !== "draft") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only draft applications can be edited this way",
				});
			}

			await tx
				.update(membershipApplications)
				.set({
					membershipTierId: input.membershipTierId,
					answers: input.answers,
				})
				.where(eq(membershipApplications.id, input.applicationId));

			return { applicationId: input.applicationId };
		}

		const applicationId = crypto.randomUUID();

		await tx.insert(membershipApplications).values({
			id: applicationId,
			membershipId: input.membershipId,
			membershipTierId: input.membershipTierId,
			organizationId: membership.organizationId,
			userId,
			status: "draft",
			answers: input.answers,
		});

		return { applicationId };
	});
}

export async function submitApplication(
	userId: string,
	input: SubmitApplicationInput,
): Promise<{ applicationId: string }> {
	assertAnswersReadyForSubmission(input.answers);

	return db.transaction(async (tx) => {
		const { membership } = await findApplicableMembershipAndTier(
			tx,
			input.membershipId,
			input.membershipTierId,
		);

		let applicationId = input.applicationId;

		if (applicationId) {
			const existing = await findOwnedApplicationOrThrow(
				tx,
				userId,
				applicationId,
			);

			if (existing.status !== "draft") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This application has already been submitted",
				});
			}
		}

		await assertNoConflictingApplicationOrMembership(
			tx,
			userId,
			input.membershipId,
			input.membershipTierId,
			applicationId,
		);

		const now = new Date();

		if (applicationId) {
			await tx
				.update(membershipApplications)
				.set({
					membershipTierId: input.membershipTierId,
					answers: input.answers,
					status: "submitted",
					submittedAt: now,
				})
				.where(eq(membershipApplications.id, applicationId));
		} else {
			applicationId = crypto.randomUUID();

			await tx.insert(membershipApplications).values({
				id: applicationId,
				membershipId: input.membershipId,
				membershipTierId: input.membershipTierId,
				organizationId: membership.organizationId,
				userId,
				status: "submitted",
				answers: input.answers,
				submittedAt: now,
			});
		}

		await recordAuditLog(tx, {
			organizationId: membership.organizationId,
			actorUserId: userId,
			action: "application.submitted",
			entityType: "membership_application",
			entityId: applicationId,
			metadata: {
				membershipId: input.membershipId,
				membershipTierId: input.membershipTierId,
			},
		});

		await notifyOrganizationAdmins(
			tx,
			membership.organizationId,
			"review_applications",
			{
				type: "application.submitted",
				title: "New membership application",
				body: `${input.answers.applicantName || "A member"} applied to ${membership.name}.`,
				data: { applicationId, membershipId: input.membershipId },
			},
		);

		return { applicationId };
	});
}

export async function withdrawApplication(
	userId: string,
	applicationId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const application = await findOwnedApplicationOrThrow(
			tx,
			userId,
			applicationId,
		);

		if (
			!(ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(
				application.status,
			)
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This application cannot be withdrawn",
			});
		}

		await tx
			.update(membershipApplications)
			.set({ status: "withdrawn" })
			.where(eq(membershipApplications.id, applicationId));

		await recordAuditLog(tx, {
			organizationId: application.organizationId,
			actorUserId: userId,
			action: "application.withdrawn",
			entityType: "membership_application",
			entityId: applicationId,
			metadata: { from: application.status },
		});
	});
}

export async function respondToInformationRequest(
	userId: string,
	input: RespondToInformationRequestInput,
): Promise<void> {
	assertAnswersReadyForSubmission(input.answers);

	await db.transaction(async (tx) => {
		const application = await findOwnedApplicationOrThrow(
			tx,
			userId,
			input.applicationId,
		);

		if (application.status !== "needs_information") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This application is not awaiting more information",
			});
		}

		const now = new Date();

		await tx
			.update(membershipApplications)
			.set({
				answers: input.answers,
				status: "submitted",
				submittedAt: now,
			})
			.where(eq(membershipApplications.id, input.applicationId));

		await recordAuditLog(tx, {
			organizationId: application.organizationId,
			actorUserId: userId,
			action: "application.resubmitted",
			entityType: "membership_application",
			entityId: input.applicationId,
			metadata: {},
		});

		await notifyOrganizationAdmins(
			tx,
			application.organizationId,
			"review_applications",
			{
				type: "application.updated",
				title: "Application updated",
				body: `${input.answers.applicantName || "A member"} responded to your information request for ${application.membership.name}.`,
				data: { applicationId: input.applicationId },
			},
		);
	});
}

export async function listMemberApplications(
	userId: string,
	input: ListMemberApplicationsInput,
): Promise<{ items: MemberApplicationSummary[]; total: number }> {
	const rows = await db.query.membershipApplications.findMany({
		where: eq(membershipApplications.userId, userId),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
	});

	const search = input.search?.trim().toLowerCase();

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter((row) => {
			if (!search) return true;

			const haystack = [
				row.membership.name,
				row.membership.organization.name,
				row.membershipTier.name,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(search);
		})
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "submittedAt") {
				const aTime = a.submittedAt?.getTime() ?? 0;
				const bTime = b.submittedAt?.getTime() ?? 0;
				return (aTime - bTime) * direction;
			}

			return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return { items: page.map(toSummary), total };
}

export async function getMemberApplicationDetail(
	userId: string,
	applicationId: string,
): Promise<MemberApplicationDetail> {
	const application = await findOwnedApplicationOrThrow(
		db,
		userId,
		applicationId,
	);

	return toDetail(application);
}

export async function getDraftApplicationForMembership(
	userId: string,
	membershipId: string,
): Promise<MemberApplicationDetail | null> {
	const application = await db.query.membershipApplications.findFirst({
		where: and(
			eq(membershipApplications.userId, userId),
			eq(membershipApplications.membershipId, membershipId),
			eq(membershipApplications.status, "draft"),
		),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
		orderBy: (table, { desc }) => desc(table.updatedAt),
	});

	return application ? toDetail(application) : null;
}

export async function getMemberStatusForMembership(
	userId: string,
	membershipId: string,
): Promise<MemberMembershipStatusInfo> {
	const application = await db.query.membershipApplications.findFirst({
		where: and(
			eq(membershipApplications.userId, userId),
			eq(membershipApplications.membershipId, membershipId),
			inArray(membershipApplications.status, ACTIVE_APPLICATION_STATUSES),
		),
	});

	const member = await db.query.membershipMembers.findFirst({
		where: and(
			eq(membershipMembers.membershipId, membershipId),
			eq(membershipMembers.userId, userId),
			inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
		),
	});

	return {
		currentTier: member
			? {
					membershipTierId: member.membershipTierId,
					status: member.status as "active" | "pending_payment",
				}
			: null,
		pendingApplication: application
			? {
					membershipTierId: application.membershipTierId,
					status: application.status as
						| "submitted"
						| "under_review"
						| "needs_information",
				}
			: null,
	};
}

const REVIEWABLE_APPLICATION_STATUSES = ["submitted", "under_review"] as const;

function answerString(answers: Record<string, unknown>, key: string): string {
	const value = answers[key];
	return typeof value === "string" ? value : "";
}

async function findOrganizationApplicationOrThrow(
	executor: DbExecutor,
	organizationId: string,
	applicationId: string,
) {
	const application = await executor.query.membershipApplications.findFirst({
		where: and(
			eq(membershipApplications.id, applicationId),
			eq(membershipApplications.organizationId, organizationId),
		),
		with: {
			membership: true,
			membershipTier: true,
		},
	});

	if (!application || application.status === "draft") {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Application not found",
		});
	}

	return application;
}

type OrganizationApplicationWithRelations = Awaited<
	ReturnType<typeof findOrganizationApplicationOrThrow>
>;

function toAdminSummary(
	row: OrganizationApplicationWithRelations,
): AdminApplicationSummary {
	const answers = row.answers;

	return {
		id: row.id,
		status: row.status,
		membershipId: row.membershipId,
		membershipName: row.membership.name,
		membershipTierId: row.membershipTierId,
		tierName: row.membershipTier.name,
		applicantUserId: row.userId,
		applicantName: answerString(answers, "applicantName"),
		applicantEmail: answerString(answers, "applicantEmail"),
		submittedAt: row.submittedAt,
		updatedAt: row.updatedAt,
	};
}

export async function listApplicationFilterOptions(
	organizationId: string,
): Promise<AdminApplicationFilterOptions> {
	const orgMemberships = await db.query.memberships.findMany({
		where: eq(memberships.organizationId, organizationId),
		columns: { id: true, name: true },
	});

	const orgTiers = await db.query.membershipTiers.findMany({
		where: inArray(
			membershipTiers.membershipId,
			orgMemberships.map((membership) => membership.id),
		),
		columns: { id: true, membershipId: true, name: true },
	});

	return {
		memberships: orgMemberships,
		tiers: orgTiers,
	};
}

export async function listApplicationsForReview(
	organizationId: string,
	input: ListAdminApplicationsInput,
): Promise<{ items: AdminApplicationSummary[]; total: number }> {
	const rows = await db.query.membershipApplications.findMany({
		where: and(
			eq(membershipApplications.organizationId, organizationId),
			ne(membershipApplications.status, "draft"),
		),
		with: {
			membership: true,
			membershipTier: true,
		},
	});

	const search = input.search?.trim().toLowerCase();

	const filtered = rows
		.filter((row) => !input.status || row.status === input.status)
		.filter(
			(row) => !input.membershipId || row.membershipId === input.membershipId,
		)
		.filter(
			(row) =>
				!input.membershipTierId ||
				row.membershipTierId === input.membershipTierId,
		)
		.filter(
			(row) =>
				!input.submittedFrom ||
				(row.submittedAt != null && row.submittedAt >= input.submittedFrom),
		)
		.filter(
			(row) =>
				!input.submittedTo ||
				(row.submittedAt != null && row.submittedAt <= input.submittedTo),
		)
		.filter((row) => {
			if (!search) return true;

			const haystack = [
				answerString(row.answers, "applicantName"),
				answerString(row.answers, "applicantEmail"),
				row.membership.name,
				row.membershipTier.name,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(search);
		})
		.sort((a, b) => {
			const direction = input.sortDir === "asc" ? 1 : -1;

			if (input.sortBy === "submittedAt") {
				const aTime = a.submittedAt?.getTime() ?? 0;
				const bTime = b.submittedAt?.getTime() ?? 0;
				return (aTime - bTime) * direction;
			}

			return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;
		});

	const total = filtered.length;
	const start = (input.page - 1) * input.pageSize;
	const page = filtered.slice(start, start + input.pageSize);

	return {
		items: page.map(toAdminSummary),
		total,
	};
}

export async function getApplicationForReview(
	organizationId: string,
	applicationId: string,
): Promise<AdminApplicationDetail> {
	const application = await findOrganizationApplicationOrThrow(
		db,
		organizationId,
		applicationId,
	);

	const member = await db.query.membershipMembers.findFirst({
		where: eq(membershipMembers.applicationId, applicationId),
		columns: { id: true, status: true },
	});

	return {
		...toAdminSummary(application),
		answers: application.answers,
		reviewNotes: application.reviewNotes,
		reviewedAt: application.reviewedAt,
		reviewedByUserId: application.reviewedByUserId,
		createdAt: application.createdAt,
		member: member ?? null,
	};
}

export async function markApplicationUnderReview(
	organizationId: string,
	userId: string,
	applicationId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const application = await findOrganizationApplicationOrThrow(
			tx,
			organizationId,
			applicationId,
		);

		if (application.status !== "submitted") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Only submitted applications can be marked under review",
			});
		}

		await tx
			.update(membershipApplications)
			.set({ status: "under_review" })
			.where(eq(membershipApplications.id, applicationId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "application.under_review",
			entityType: "membership_application",
			entityId: applicationId,
			metadata: { from: application.status },
		});

		await createNotification(tx, {
			userId: application.userId,
			type: "application.under_review",
			title: "Application under review",
			body: `Your application to ${application.membership.name} is now under review.`,
			data: { applicationId },
		});
	});
}

export async function approveApplication(
	organizationId: string,
	userId: string,
	applicationId: string,
	reviewNotes?: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const application = await findOrganizationApplicationOrThrow(
			tx,
			organizationId,
			applicationId,
		);

		if (
			!(REVIEWABLE_APPLICATION_STATUSES as readonly string[]).includes(
				application.status,
			)
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This application cannot be approved from its current status",
			});
		}

		const existingMember = await tx.query.membershipMembers.findFirst({
			where: and(
				eq(membershipMembers.membershipId, application.membershipId),
				eq(membershipMembers.userId, application.userId),
				inArray(membershipMembers.status, ACTIVE_MEMBER_STATUSES),
			),
		});

		const isUpgrade =
			existingMember != null &&
			existingMember.membershipTierId !== application.membershipTierId;

		if (existingMember && !isUpgrade) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "This member already has an active membership at this tier",
			});
		}

		const memberStatus =
			application.membershipTier.billingInterval === "free"
				? "active"
				: "pending_payment";

		const now = new Date();

		if (isUpgrade && existingMember) {
			await tx
				.update(membershipMembers)
				.set({
					membershipTierId: application.membershipTierId,
					applicationId,
					status: memberStatus,
				})
				.where(eq(membershipMembers.id, existingMember.id));
		} else {
			await tx.insert(membershipMembers).values({
				id: crypto.randomUUID(),
				membershipId: application.membershipId,
				membershipTierId: application.membershipTierId,
				organizationId,
				userId: application.userId,
				applicationId,
				status: memberStatus,
			});
		}

		await tx
			.update(membershipApplications)
			.set({
				status: "approved",
				reviewedAt: now,
				reviewedByUserId: userId,
				...(reviewNotes ? { reviewNotes } : {}),
			})
			.where(eq(membershipApplications.id, applicationId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "application.approved",
			entityType: "membership_application",
			entityId: applicationId,
			metadata: {
				membershipId: application.membershipId,
				membershipTierId: application.membershipTierId,
				memberStatus,
				isUpgrade,
			},
		});

		await createNotification(tx, {
			userId: application.userId,
			type: "application.approved",
			title: isUpgrade ? "Tier upgrade approved" : "Application approved",
			body: isUpgrade
				? `Your membership tier for ${application.membership.name} has been updated to ${application.membershipTier.name}.`
				: memberStatus === "active"
					? `You're now a member of ${application.membership.name}.`
					: `Your application to ${application.membership.name} was approved. Complete payment to activate your membership.`,
			data: { applicationId, membershipId: application.membershipId },
		});

		if (memberStatus === "active" && !isUpgrade) {
			await notifyOrganizationAdmins(tx, organizationId, "manage_members", {
				type: "member.activated",
				title: "New member activated",
				body: `A new member joined ${application.membership.name}.`,
				data: { applicationId, membershipId: application.membershipId },
			});
		}
	});
}

export async function rejectApplication(
	organizationId: string,
	userId: string,
	applicationId: string,
	reviewNotes: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const application = await findOrganizationApplicationOrThrow(
			tx,
			organizationId,
			applicationId,
		);

		if (
			!(REVIEWABLE_APPLICATION_STATUSES as readonly string[]).includes(
				application.status,
			)
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This application cannot be rejected from its current status",
			});
		}

		const now = new Date();

		await tx
			.update(membershipApplications)
			.set({
				status: "rejected",
				reviewedAt: now,
				reviewedByUserId: userId,
				reviewNotes,
			})
			.where(eq(membershipApplications.id, applicationId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "application.rejected",
			entityType: "membership_application",
			entityId: applicationId,
			metadata: { reviewNotes },
		});

		await createNotification(tx, {
			userId: application.userId,
			type: "application.rejected",
			title: "Application rejected",
			body: `Your application to ${application.membership.name} was rejected. Reason: ${reviewNotes}`,
			data: { applicationId },
		});
	});
}

export async function requestApplicationInformation(
	organizationId: string,
	userId: string,
	applicationId: string,
	message: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const application = await findOrganizationApplicationOrThrow(
			tx,
			organizationId,
			applicationId,
		);

		if (
			!(REVIEWABLE_APPLICATION_STATUSES as readonly string[]).includes(
				application.status,
			)
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					"This application cannot have more information requested from its current status",
			});
		}

		const now = new Date();

		await tx
			.update(membershipApplications)
			.set({
				status: "needs_information",
				reviewedAt: now,
				reviewedByUserId: userId,
				reviewNotes: message,
			})
			.where(eq(membershipApplications.id, applicationId));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "application.needs_information",
			entityType: "membership_application",
			entityId: applicationId,
			metadata: { message },
		});

		await createNotification(tx, {
			userId: application.userId,
			type: "application.needs_information",
			title: "More information requested",
			body: `${application.membership.name} requested more information: ${message}`,
			data: { applicationId },
		});
	});
}

export async function markApplicationPaymentReceived(
	organizationId: string,
	userId: string,
	applicationId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const application = await findOrganizationApplicationOrThrow(
			tx,
			organizationId,
			applicationId,
		);

		if (application.status !== "approved") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Only approved applications can have payment recorded",
			});
		}

		const member = await tx.query.membershipMembers.findFirst({
			where: eq(membershipMembers.applicationId, applicationId),
		});

		if (member?.status !== "pending_payment") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This membership is not awaiting payment",
			});
		}

		await tx
			.update(membershipMembers)
			.set({ status: "active" })
			.where(eq(membershipMembers.id, member.id));

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "membership.payment_received",
			entityType: "membership_member",
			entityId: member.id,
			metadata: { applicationId },
		});

		await createNotification(tx, {
			userId: application.userId,
			type: "membership.payment_received",
			title: "Payment received",
			body: `Your payment was received. Your membership to ${application.membership.name} is now active.`,
			data: { applicationId, membershipId: application.membershipId },
		});
	});
}
