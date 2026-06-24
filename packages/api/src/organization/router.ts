import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "../index";
import { organizationPermissionProcedure } from "../procedures";
import {
	getOrganizationDashboardOverview,
	getOrganizationForAdmin,
	getPublicOrganizationBySlug,
	listPublicOrganizations,
	updateOrganization,
} from "./service";
import {
	getPublicOrganizationInput,
	listPublicOrganizationsInput,
	organizationUpdateInput,
} from "./types";

export const organizationRouter = router({
	listPublic: publicProcedure
		.input(listPublicOrganizationsInput)
		.query(({ input }) => listPublicOrganizations(input)),

	getPublicBySlug: publicProcedure
		.input(getPublicOrganizationInput)
		.query(async ({ input }) => {
			const organization = await getPublicOrganizationBySlug(
				input.organizationSlug,
			);

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "This organization is not available",
				});
			}

			return organization;
		}),

	adminDashboard: organizationPermissionProcedure(
		"view_organization_dashboard",
	).query(({ ctx }) =>
		getOrganizationDashboardOverview(ctx.organization.organizationId),
	),

	adminGet: organizationPermissionProcedure(
		"update_organization_settings",
	).query(({ ctx }) =>
		getOrganizationForAdmin(ctx.organization.organizationId),
	),

	update: organizationPermissionProcedure("update_organization_settings")
		.input(organizationUpdateInput)
		.mutation(({ ctx, input }) =>
			updateOrganization(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),
});
