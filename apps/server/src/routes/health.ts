import { checkAuthHealth } from "@membership-connector-app/auth";
import { checkDbHealth } from "@membership-connector-app/db";
import { env } from "@membership-connector-app/env/server";
import {
	elapsedMs,
	getMetricsSnapshot,
	nowMs,
	recordReadinessMetric,
} from "@membership-connector-app/observability";
import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
	app.get("/api/health", async () => {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
		};
	});

	app.get("/api/ready", async (_request, reply) => {
		const dbStart = nowMs();
		const db = await checkDbHealth(env.HEALTHCHECK_TIMEOUT_MS);
		recordReadinessMetric({
			check: "db",
			status: db.status,
			durationMs: elapsedMs(dbStart),
		});

		const authStart = nowMs();
		const authCheck = await checkAuthHealth();
		recordReadinessMetric({
			check: "auth",
			status: authCheck.status,
			durationMs: elapsedMs(authStart),
		});

		const checks = {
			db,
			auth: authCheck,
		};

		const values = Object.values(checks).map((check) => check.status);
		const status = values.includes("fail")
			? "unhealthy"
			: values.includes("fail")
				? "degraded"
				: "ok";

		const statusCode = status === "unhealthy" ? 503 : 200;
		return reply.status(statusCode).send({
			status,
			timestamp: new Date().toISOString(),
			checks,
		});
	});

	app.get("/api/metrics", async () => {
		return {
			service: env.SERVICE_NAME,
			timestamp: new Date().toISOString(),
			metrics: getMetricsSnapshot(),
		};
	});
}
