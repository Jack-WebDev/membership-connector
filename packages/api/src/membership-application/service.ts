import { db } from "@membership-connector-app/db";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import {
	membershipApplications,
	membershipMembers,
	memberships,
	membershipTiers,
} from "@membership-connector-app/db/schema/membership";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne } from "drizzle-orm";

import { notifyOrganizationAdmins } from "../notification/service";
import type {
	ApplicationAnswersInput,
	MemberApplicationDetail,
	MemberApplicationSummary,
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

	if (activeMembership) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "You already have an active membership for this membership",
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

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
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

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
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

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
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
): Promise<MemberApplicationSummary[]> {
	const rows = await db.query.membershipApplications.findMany({
		where: eq(membershipApplications.userId, userId),
		with: {
			membership: { with: { organization: true } },
			membershipTier: true,
		},
		orderBy: (table, { desc }) => desc(table.updatedAt),
	});

	return rows.map(toSummary);
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
