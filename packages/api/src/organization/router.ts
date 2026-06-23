import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "../index";
import { organizationPermissionProcedure } from "../procedures";
import {
	getOrganizationDashboardOverview,
	getPublicOrganizationBySlug,
	listPublicOrganizations,
} from "./service";
import {
	getPublicOrganizationInput,
	listPublicOrganizationsInput,
} from "./types";

export const organizationRouter = router({
	listPublic: publicProcedure
		.input(listPublicOrganizationsInput)
		.query(({ input }) => listPublicOrganizations(input.search)),

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
});
