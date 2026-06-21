import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		PORT: z.coerce.number().default(3000),
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
