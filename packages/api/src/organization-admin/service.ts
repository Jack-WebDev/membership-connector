import { db } from "@membership-connector-app/db";
import { auditLogs } from "@membership-connector-app/db/schema/audit";
import { user } from "@membership-connector-app/db/schema/auth";
import { organizationAdmins } from "@membership-connector-app/db/schema/organization";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";

import {
	createNotification,
	notifyOrganizationAdmins,
} from "../notification/service";
import { isLastActiveOwner } from "./last-owner";
import type {
	InviteAdminInput,
	OrganizationAdminRoleValue,
	OrganizationAdminSummary,
} from "./types";

function humanizeRole(role: string): string {
	return role.replace(/_/g, " ");
}

export async function listOrganizationAdmins(
	organizationId: string,
): Promise<OrganizationAdminSummary[]> {
	const rows = await db
		.select({
			id: organizationAdmins.id,
			userId: organizationAdmins.userId,
			userName: user.name,
			userEmail: user.email,
			role: organizationAdmins.role,
			status: organizationAdmins.status,
			invitedAt: organizationAdmins.createdAt,
			invitedByUserId: organizationAdmins.invitedByUserId,
		})
		.from(organizationAdmins)
		.innerJoin(user, eq(organizationAdmins.userId, user.id))
		.where(
			and(
				eq(organizationAdmins.organizationId, organizationId),
				ne(organizationAdmins.status, "removed"),
			),
		)
		.orderBy(organizationAdmins.createdAt);

	return rows as OrganizationAdminSummary[];
}

export async function inviteAdmin(
	organizationId: string,
	actorUserId: string,
	actorRole: OrganizationAdminRoleValue,
	organizationName: string,
	input: InviteAdminInput,
): Promise<void> {
	if (input.role === "owner" && actorRole !== "owner") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only an owner can assign the owner role",
		});
	}

	await db.transaction(async (tx) => {
		const invitee = await tx.query.user.findFirst({
			where: eq(user.email, input.email),
		});

		if (!invitee) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "No account found for this email. Ask them to register first.",
			});
		}

		const existing = await tx.query.organizationAdmins.findFirst({
			where: and(
				eq(organizationAdmins.organizationId, organizationId),
				eq(organizationAdmins.userId, invitee.id),
			),
		});

		if (existing?.status === "active") {
			throw new TRPCError({
				code: "CONFLICT",
				message: "This person is already an admin of this organization",
			});
		}

		if (existing?.status === "invited") {
			throw new TRPCError({
				code: "CONFLICT",
				message: "This person already has a pending invite",
			});
		}

		const adminId = existing?.id ?? crypto.randomUUID();

		if (existing) {
			await tx
				.update(organizationAdmins)
				.set({
					role: input.role,
					status: "invited",
					invitedByUserId: actorUserId,
				})
				.where(eq(organizationAdmins.id, existing.id));
		} else {
			await tx.insert(organizationAdmins).values({
				id: adminId,
				organizationId,
				userId: invitee.id,
				role: input.role,
				status: "invited",
				invitedByUserId: actorUserId,
			});
		}

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId,
			action: "admin.invited",
			entityType: "organization_admin",
			entityId: adminId,
			metadata: {
				invitedUserId: invitee.id,
				role: input.role,
				reinvited: Boolean(existing),
			},
		});

		await createNotification(tx, {
			userId: invitee.id,
			type: "admin.invited",
			title: "You've been invited as an organization admin",
			body: `You've been invited to join ${organizationName} as ${humanizeRole(input.role)}.`,
			data: { organizationId, adminId, role: input.role },
		});
	});
}

export async function changeAdminRole(
	organizationId: string,
	actorUserId: string,
	adminId: string,
	role: OrganizationAdminRoleValue,
): Promise<void> {
	await db.transaction(async (tx) => {
		const admins = await tx.query.organizationAdmins.findMany({
			where: and(
				eq(organizationAdmins.organizationId, organizationId),
				ne(organizationAdmins.status, "removed"),
			),
		});

		const target = admins.find((admin) => admin.id === adminId);

		if (!target) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
		}

		if (target.status !== "active") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Only active admins can have their role changed",
			});
		}

		if (role === target.role) {
			return;
		}

		if (target.role === "owner" && isLastActiveOwner(admins, adminId)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot change the role of the last remaining owner",
			});
		}

		await tx
			.update(organizationAdmins)
			.set({ role })
			.where(eq(organizationAdmins.id, adminId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId,
			action: "admin.role_changed",
			entityType: "organization_admin",
			entityId: adminId,
			metadata: { from: target.role, to: role },
		});

		await createNotification(tx, {
			userId: target.userId,
			type: "admin.role_changed",
			title: "Your organization role has changed",
			body: `Your role was changed from ${humanizeRole(target.role)} to ${humanizeRole(role)}.`,
			data: { organizationId, adminId, from: target.role, to: role },
		});
	});
}

export async function removeAdmin(
	organizationId: string,
	actorUserId: string,
	adminId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const admins = await tx.query.organizationAdmins.findMany({
			where: and(
				eq(organizationAdmins.organizationId, organizationId),
				ne(organizationAdmins.status, "removed"),
			),
		});

		const target = admins.find((admin) => admin.id === adminId);

		if (!target) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
		}

		if (target.role === "owner" && isLastActiveOwner(admins, adminId)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot remove the last remaining owner",
			});
		}

		await tx
			.update(organizationAdmins)
			.set({ status: "removed" })
			.where(eq(organizationAdmins.id, adminId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId,
			action:
				target.status === "invited"
					? "admin.invite_cancelled"
					: "admin.removed",
			entityType: "organization_admin",
			entityId: adminId,
			metadata: { previousStatus: target.status, role: target.role },
		});

		if (target.status === "active") {
			await createNotification(tx, {
				userId: target.userId,
				type: "admin.removed",
				title: "Your admin access was removed",
				body: "You no longer have admin access to this organization.",
				data: { organizationId },
			});
		}
	});
}

export async function resendInvite(
	organizationId: string,
	actorUserId: string,
	organizationName: string,
	adminId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const target = await tx.query.organizationAdmins.findFirst({
			where: and(
				eq(organizationAdmins.id, adminId),
				eq(organizationAdmins.organizationId, organizationId),
			),
		});

		if (!target) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
		}

		if (target.status !== "invited") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Only pending invites can be resent",
			});
		}

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId,
			actorUserId,
			action: "admin.invite_resent",
			entityType: "organization_admin",
			entityId: adminId,
			metadata: { role: target.role },
		});

		await createNotification(tx, {
			userId: target.userId,
			type: "admin.invited",
			title: "Reminder: you've been invited as an organization admin",
			body: `You've been invited to join ${organizationName} as ${humanizeRole(target.role)}.`,
			data: { organizationId, adminId, role: target.role },
		});
	});
}

export async function acceptInvite(
	userId: string,
	adminId: string,
): Promise<void> {
	await db.transaction(async (tx) => {
		const row = await tx.query.organizationAdmins.findFirst({
			where: eq(organizationAdmins.id, adminId),
		});

		if (!row || row.userId !== userId) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
		}

		if (row.status !== "invited") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "This invite is no longer pending",
			});
		}

		await tx
			.update(organizationAdmins)
			.set({ status: "active" })
			.where(eq(organizationAdmins.id, adminId));

		await tx.insert(auditLogs).values({
			id: crypto.randomUUID(),
			organizationId: row.organizationId,
			actorUserId: userId,
			action: "admin.invite_accepted",
			entityType: "organization_admin",
			entityId: adminId,
			metadata: { role: row.role },
		});

		const acceptedUser = await tx.query.user.findFirst({
			where: eq(user.id, userId),
			columns: { name: true },
		});

		await notifyOrganizationAdmins(tx, row.organizationId, "invite_admins", {
			type: "admin.invite_accepted",
			title: "Admin invite accepted",
			body: `${acceptedUser?.name ?? "A new admin"} has accepted their invite and is now active.`,
			data: { organizationId: row.organizationId, adminId, role: row.role },
		});
	});
}
