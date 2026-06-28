import { db } from "../client";
import {
	categories,
	membershipApplications,
	membershipMembers,
	memberships,
	membershipTiers,
	savedMemberships,
} from "../schema/membership";
import {
	type AppOutcome,
	applicationDefs,
	categoryDefs,
	type MemberKey,
	type MembershipKey,
	memberDefs,
	membershipDefs,
	type OrgKey,
	savedMembershipDefs,
	type TierKey,
	tierDefs,
} from "./data";

export async function seedCategories(): Promise<Record<string, string>> {
	const categoryIds: Record<string, string> = {};

	for (const def of categoryDefs) {
		const categoryId = crypto.randomUUID();

		await db.insert(categories).values({
			id: categoryId,
			slug: def.slug,
			name: def.name,
			sortOrder: def.sortOrder,
		});

		categoryIds[def.slug] = categoryId;
	}

	return categoryIds;
}

export async function seedMemberships(
	orgIds: Record<OrgKey, string>,
	categoryIds: Record<string, string>,
): Promise<Record<MembershipKey, string>> {
	const membershipIds = {} as Record<MembershipKey, string>;

	for (const def of membershipDefs) {
		const membershipId = crypto.randomUUID();
		const categoryId = categoryIds[def.categorySlug];
		if (!categoryId) {
			throw new Error(`Unknown category slug: ${def.categorySlug}`);
		}

		await db.insert(memberships).values({
			id: membershipId,
			organizationId: orgIds[def.orgKey],
			name: def.name,
			slug: def.slug,
			description: def.description,
			shortDescription: def.shortDescription,
			status: def.status,
			visibility: "public",
			categoryId,
			applicationRequired: true,
			publicAnnouncementsEnabled: true,
			membersOnlyContentEnabled: true,
		});

		membershipIds[def.key] = membershipId;
	}

	return membershipIds;
}

export async function seedTiers(
	membershipIds: Record<MembershipKey, string>,
): Promise<Record<TierKey, string>> {
	const tierIds = {} as Record<TierKey, string>;

	for (const def of tierDefs) {
		const tierId = crypto.randomUUID();

		await db.insert(membershipTiers).values({
			id: tierId,
			membershipId: membershipIds[def.membershipKey],
			name: def.name,
			price: def.price.toFixed(2),
			currency: "ZAR",
			billingInterval: def.billingInterval,
			benefits: def.benefits,
			requirements: [],
			status: def.status,
		});

		tierIds[def.key] = tierId;
	}

	return tierIds;
}

export type ActiveMembership = {
	memberKey: MemberKey;
	membershipKey: MembershipKey;
	tierKey: TierKey;
};

function resolveApplicationState(outcome: AppOutcome) {
	const now = new Date();

	switch (outcome) {
		case "approved_free":
			return {
				status: "approved" as const,
				submittedAt: now,
				reviewedAt: now,
				reviewNotes: "Great fit for this community.",
			};
		case "approved_paid":
			return {
				status: "approved" as const,
				submittedAt: now,
				reviewedAt: now,
				reviewNotes: "Approved, awaiting payment.",
			};
		case "rejected":
			return {
				status: "rejected" as const,
				submittedAt: now,
				reviewedAt: now,
				reviewNotes: "This membership is not the right fit at this time.",
			};
		case "needs_information":
			return {
				status: "needs_information" as const,
				submittedAt: now,
				reviewedAt: null,
				reviewNotes: "Please provide more detail about your background.",
			};
		case "under_review":
			return {
				status: "under_review" as const,
				submittedAt: now,
				reviewedAt: null,
				reviewNotes: null,
			};
		case "submitted":
			return {
				status: "submitted" as const,
				submittedAt: now,
				reviewedAt: null,
				reviewNotes: null,
			};
	}
}

export async function seedApplicationsAndMembers(
	orgIds: Record<OrgKey, string>,
	membershipIds: Record<MembershipKey, string>,
	tierIds: Record<TierKey, string>,
	memberIds: Record<MemberKey, string>,
	ownerIds: Record<OrgKey, string>,
): Promise<{
	activeMemberships: ActiveMembership[];
	paidApprovals: ActiveMembership[];
}> {
	const membershipDefByKey = new Map(
		membershipDefs.map((def) => [def.key, def]),
	);
	const activeMemberships: ActiveMembership[] = [];
	const paidApprovals: ActiveMembership[] = [];

	for (const def of applicationDefs) {
		const membershipDef = membershipDefByKey.get(def.membershipKey);
		if (!membershipDef) {
			throw new Error(`Unknown membership key: ${def.membershipKey}`);
		}

		const orgId = orgIds[membershipDef.orgKey];
		const ownerId = ownerIds[membershipDef.orgKey];
		const memberId = memberIds[def.memberKey];
		const memberDef = memberDefs[def.memberKey];
		const state = resolveApplicationState(def.outcome);
		const applicationId = crypto.randomUUID();
		const isApproved =
			def.outcome === "approved_free" || def.outcome === "approved_paid";

		await db.insert(membershipApplications).values({
			id: applicationId,
			membershipId: membershipIds[def.membershipKey],
			membershipTierId: tierIds[def.tierKey],
			organizationId: orgId,
			userId: memberId,
			status: state.status,
			answers: {
				applicantName: memberDef.name,
				applicantEmail: memberDef.email,
				applicantPhone: "+27821234567",
				reason: `I would like to join ${membershipDef.name} to connect with this community and grow.`,
				background:
					"I have several years of relevant experience in this space.",
				notes: "",
				agreement: true,
			},
			reviewNotes: state.reviewNotes,
			submittedAt: state.submittedAt,
			reviewedAt: state.reviewedAt,
			reviewedByUserId: state.reviewedAt ? ownerId : null,
		});

		if (isApproved) {
			await db.insert(membershipMembers).values({
				id: crypto.randomUUID(),
				membershipId: membershipIds[def.membershipKey],
				membershipTierId: tierIds[def.tierKey],
				organizationId: orgId,
				userId: memberId,
				applicationId,
				status: "active",
				startedAt: state.reviewedAt ?? new Date(),
			});

			activeMemberships.push({
				memberKey: def.memberKey,
				membershipKey: def.membershipKey,
				tierKey: def.tierKey,
			});

			if (def.outcome === "approved_paid") {
				paidApprovals.push({
					memberKey: def.memberKey,
					membershipKey: def.membershipKey,
					tierKey: def.tierKey,
				});
			}
		}
	}

	return { activeMemberships, paidApprovals };
}

export async function seedSavedMemberships(
	memberIds: Record<MemberKey, string>,
	membershipIds: Record<MembershipKey, string>,
): Promise<void> {
	for (const def of savedMembershipDefs) {
		await db.insert(savedMemberships).values({
			id: crypto.randomUUID(),
			userId: memberIds[def.memberKey],
			membershipId: membershipIds[def.membershipKey],
		});
	}
}
