import { db } from "@membership-connector-app/db";
import {
	accountRoles,
	userProfiles,
} from "@membership-connector-app/db/schema/account";
import {
	organizationAdmins,
	organizations,
} from "@membership-connector-app/db/schema/organization";
import type { DbExecutor } from "@membership-connector-app/db/types";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { recordAuditLog } from "../audit-log/service";
import type {
	MemberOnboardingInput,
	OrganizationOnboardingInput,
} from "./types";

async function ensureAccountRole(
	tx: DbExecutor,
	userId: string,
	role: "member" | "organization",
) {
	await tx
		.insert(accountRoles)
		.values({ id: crypto.randomUUID(), userId, role })
		.onConflictDoNothing({
			target: [accountRoles.userId, accountRoles.role],
		});
}

export async function completeMemberOnboarding(
	userId: string,
	input: MemberOnboardingInput,
) {
	await db.transaction(async (tx) => {
		await ensureAccountRole(tx, userId, "member");

		const [existingProfile] = await tx
			.select({ id: userProfiles.id })
			.from(userProfiles)
			.where(eq(userProfiles.userId, userId))
			.limit(1);

		if (!existingProfile) {
			await tx.insert(userProfiles).values({
				id: crypto.randomUUID(),
				userId,
				firstName: input.firstName,
				lastName: input.lastName,
				phone: input.phone ? input.phone : null,
			});
		}
	});

	return { redirectPath: "/member/dashboard" as const };
}

export async function completeOrganizationOnboarding(
	userId: string,
	input: OrganizationOnboardingInput,
) {
	const organizationId = crypto.randomUUID();

	await db.transaction(async (tx) => {
		await ensureAccountRole(tx, userId, "organization");

		const [existingSlug] = await tx
			.select({ id: organizations.id })
			.from(organizations)
			.where(eq(organizations.slug, input.slug))
			.limit(1);

		if (existingSlug) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "That organization slug is already taken. Try another.",
			});
		}

		await tx.insert(organizations).values({
			id: organizationId,
			name: input.name,
			slug: input.slug,
			description: input.description ? input.description : null,
			websiteUrl: input.websiteUrl ? input.websiteUrl : null,
			email: input.email ? input.email : null,
			phone: input.phone ? input.phone : null,
			status: "active",
			createdByUserId: userId,
		});

		await tx.insert(organizationAdmins).values({
			id: crypto.randomUUID(),
			organizationId,
			userId,
			role: "owner",
			status: "active",
			invitedByUserId: null,
		});

		await recordAuditLog(tx, {
			organizationId,
			actorUserId: userId,
			action: "organization.created",
			entityType: "organization",
			entityId: organizationId,
			metadata: { name: input.name, slug: input.slug },
		});
	});

	return {
		redirectPath: `/org/${input.slug}/dashboard`,
		slug: input.slug,
	};
}
