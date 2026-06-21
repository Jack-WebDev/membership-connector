import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	findAuthorizedOrganizationForUser,
	listAccountRolesForUser,
} from "./account-access";
import { protectedProcedure } from "./index";
import {
	hasOrganizationPermission,
	type OrganizationPermission,
} from "./permissions/permissions";

export const memberProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const roles = await listAccountRolesForUser(ctx.session.user.id);

	if (!roles.includes("member")) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "A member account role is required",
		});
	}

	return next({ ctx });
});

export const platformAdminProcedure = protectedProcedure.use(
	async ({ ctx, next }) => {
		const roles = await listAccountRolesForUser(ctx.session.user.id);

		if (!roles.includes("platform_admin")) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "A platform admin account role is required",
			});
		}

		return next({ ctx });
	},
);

const organizationSlugInput = z.object({
	organizationSlug: z.string().min(1),
});

export const organizationProcedure = protectedProcedure
	.input(organizationSlugInput)
	.use(async ({ ctx, input, next }) => {
		const organization = await findAuthorizedOrganizationForUser(
			ctx.session.user.id,
			input.organizationSlug,
		);

		if (!organization) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have access to this organization",
			});
		}

		return next({
			ctx: {
				...ctx,
				organization,
			},
		});
	});

export function organizationPermissionProcedure(
	permission: OrganizationPermission,
) {
	return organizationProcedure.use(async ({ ctx, next }) => {
		if (!hasOrganizationPermission(ctx.organization.role, permission)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `You do not have permission to perform this action (${permission})`,
			});
		}

		return next({ ctx });
	});
}
