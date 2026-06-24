import {
	beginLulafiOAuthFlow,
	completeLulafiOAuthFlow,
} from "@membership-connector-app/auth/lulafi-bridge";
import type { FastifyInstance, FastifyReply } from "fastify";

function applyRedirectResponse(
	reply: FastifyReply,
	result: {
		redirectTo: string;
		setCookies: string[];
	},
) {
	reply.header("set-cookie", result.setCookies);
	return reply.redirect(result.redirectTo);
}

export async function lulafiAuthRoutes(app: FastifyInstance) {
	app.get("/api/lulafi/auth/start", async (request, reply) => {
		const returnTo =
			typeof request.query === "object" &&
			request.query !== null &&
			"returnTo" in request.query &&
			typeof request.query.returnTo === "string"
				? request.query.returnTo
				: undefined;

		const result = await beginLulafiOAuthFlow(returnTo);
		return applyRedirectResponse(reply, result);
	});

	app.get("/api/lulafi/auth/callback", async (request, reply) => {
		const query =
			typeof request.query === "object" && request.query !== null
				? (request.query as Record<string, unknown>)
				: {};

		const result = await completeLulafiOAuthFlow({
			code: typeof query.code === "string" ? query.code : undefined,
			state: typeof query.state === "string" ? query.state : undefined,
			error: typeof query.error === "string" ? query.error : undefined,
			cookieHeader:
				typeof request.headers.cookie === "string"
					? request.headers.cookie
					: undefined,
		});

		return applyRedirectResponse(reply, result);
	});
}
