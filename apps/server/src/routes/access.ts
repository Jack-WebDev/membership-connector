import {
	findAuthorizedOrganizationForUser,
	getAuthenticatedHomePath,
	listAccountRolesForUser,
} from "@membership-connector-app/api/account-access";
import { auth } from "@membership-connector-app/auth";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";

export async function accessRoutes(app: FastifyInstance) {
	app.get("/api/access/session-summary", async (request) => {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});

		if (!session) {
			return {
				authenticated: false as const,
			};
		}

		const roles = await listAccountRolesForUser(session.user.id);
		const redirectPath = await getAuthenticatedHomePath(session.user.id);
		const orgSlug =
			typeof request.query === "object" &&
			request.query !== null &&
			"orgSlug" in request.query &&
			typeof request.query.orgSlug === "string"
				? request.query.orgSlug
				: null;

		const organizationAccess = orgSlug
			? await findAuthorizedOrganizationForUser(session.user.id, orgSlug)
			: null;

		return {
			authenticated: true as const,
			session: {
				user: session.user,
			},
			roles,
			redirectPath,
			organizationAccess,
		};
	});
}
