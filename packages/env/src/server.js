import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		LULA_ISSUER: z.url(),
		LULA_CLIENT_ID: z.string().min(1),
		LULA_CLIENT_SECRET: z.string().min(1),
		LULA_CHAT_ENABLED: z
			.enum(["true", "false"])
			.transform((value) => value === "true")
			.default(false),
		LULA_CHAT_API_KEY: z.string().min(1).optional(),
		LULA_CHAT_XMPP_DOMAIN: z.string().min(1).optional(),
		LULA_CHAT_USER_ID: z.string().min(1).optional(),
		LULA_CHAT_DEVICE_ID: z.string().min(1).optional(),
		LULA_CHAT_RESOURCE: z.string().min(1).default("server-client"),
		LULA_CHAT_AUTH_TYPE: z.enum(["password", "x-oauth2"]).default("password"),
		LULA_CHAT_PASSWORD: z.string().min(1).optional(),
		LULA_CHAT_ACCESS_TOKEN: z.string().min(1).optional(),
		LULA_CHAT_DEFAULT_MEMBERSHIP_ID: z.string().min(1).optional(),
		LULA_CHAT_DEFAULT_TIER_ID: z.string().min(1).optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		PORT: z.coerce.number().default(3001),
		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
			.default("info"),
		LOG_PRETTY: z
			.enum(["true", "false"])
			.transform((value) => value === "true")
			.default(false),
		LOG_REDACT: z
			.enum(["true", "false"])
			.transform((value) => value !== "false")
			.default(true),
		APP_VERSION: z.string().min(1).default("dev"),
		SERVICE_NAME: z.string().min(1).default("membership-connector-app-server"),
		HEALTHCHECK_TIMEOUT_MS: z.coerce.number().positive().default(1500),
		DB_SLOW_QUERY_THRESHOLD_MS: z.coerce.number().positive().default(500),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
