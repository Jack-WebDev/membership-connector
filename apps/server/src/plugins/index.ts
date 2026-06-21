/** biome-ignore-all lint/suspicious/noExplicitAny: biome-ignore lint: false positive */
import fastifyCircuitBreaker from "@fastify/circuit-breaker";
import fastifyCompress from "@fastify/compress";
import fastifyCors from "@fastify/cors";

import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { createContext } from "@membership-connector-app/api/context";
import {
	type AppRouter,
	appRouter,
} from "@membership-connector-app/api/routers/index";
import { env } from "@membership-connector-app/env/server";
import { logError } from "@membership-connector-app/observability";
import type { TRPCError } from "@trpc/server";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import type { FastifyInstance, FastifyRequest } from "fastify";

export async function registerPlugins(app: FastifyInstance) {
	await app.register(fastifyHelmet, {
		// CSP can be tightened per-environment once you know your asset origins
		contentSecurityPolicy: env.NODE_ENV === "production",
	});

	await app.register(fastifyCors, {
		origin: env.CORS_ORIGIN,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		credentials: true,
		maxAge: 86400,
	});

	// Global rate limit — auth routes get a stricter limit applied at the route level
	await app.register(fastifyRateLimit, {
		max: 200,
		timeWindow: "1 minute",
		errorResponseBuilder: (_request: FastifyRequest, context) => ({
			statusCode: context.statusCode,
			error: "Too Many Requests",
			code: "RATE_LIMITED",
			retryAfter: context.after,
		}),
	});

	// --- Performance ---

	await app.register(fastifyCompress, {
		// Only compress responses above 1KB — small payloads aren't worth the CPU
		threshold: 1024,
		encodings: ["gzip", "deflate"],
	});

	await app.register(fastifyCircuitBreaker, {
		threshold: 3, // open after 3 consecutive failures
		timeout: 10000, // half-open probe after 10s
		resetTimeout: 30000,
	});

	await app.register(fastifyTRPCPlugin, {
		prefix: "/trpc",
		trpcOptions: {
			router: appRouter,
			createContext,
			onError({
				path,
				error,
				type,
				ctx,
				req,
			}: {
				path?: string;
				error: TRPCError;
				type: any;
				ctx?: any;
				req: FastifyRequest;
			}) {
				logError("trpc.request.failed", {
					err: error,
					procedure: path ?? "unknown",
					type,
					errorCode: error.code,
					hasSession: Boolean(ctx?.session),
					userId: ctx?.session?.user.id,
					method: req.method,
					route: "/trpc",
				});
			},
		} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
	});
}
