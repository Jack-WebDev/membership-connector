import { db } from "@membership-connector-app/db";
import * as schema from "@membership-connector-app/db/schema/auth";
import { env } from "@membership-connector-app/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
			sendResetPassword: async ({ user, token, url }) => {
				console.info(
					`[better-auth] Password reset requested for ${user.email}. Token: ${token}. URL: ${url}`,
				);
			},
			resetPasswordTokenExpiresIn: 60 * 60,
			revokeSessionsOnPasswordReset: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [],
	});
}

export const auth = createAuth();

export async function checkAuthHealth() {
	try {
		void new URL(env.BETTER_AUTH_URL);
		return {
			status: "ok" as const,
			message: "Authentication service configured",
		};
	} catch (error) {
		return {
			status: "fail" as const,
			message:
				error instanceof Error
					? error.message
					: "Authentication service misconfigured",
		};
	}
}
