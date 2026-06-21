import { env } from "@membership-connector-app/env/server";
import { logError } from "@membership-connector-app/observability";
import { db, originalQuery, pool, withDbInstrumentation } from "./client";

export type { DbExecutor } from "./types";
export { db, pool };

export async function closeDb() {
	await pool.end();
}

export async function checkDbHealth(timeoutMs = env.HEALTHCHECK_TIMEOUT_MS) {
	let timeout: NodeJS.Timeout | undefined;

	try {
		const { durationMs } = await withDbInstrumentation(
			"healthcheck",
			async () => {
				await Promise.race([
					originalQuery("select 1"),
					new Promise<never>((_, reject) => {
						timeout = setTimeout(() => {
							reject(
								new Error(
									`Database health check timed out after ${timeoutMs}ms`,
								),
							);
						}, timeoutMs);
					}),
				]);
			},
		);

		return {
			status: "ok" as const,
			durationMs,
		};
	} catch (wrapped) {
		const { err, durationMs, errorCode } = wrapped as {
			err: unknown;
			durationMs: number;
			errorCode: string;
		};

		logError("db.healthcheck.failed", {
			err,
			dependency: "postgres",
			durationMs,
			errorCode,
		});

		return {
			status: "fail" as const,
			durationMs,
			message:
				err instanceof Error ? err.message : "Database health check failed",
		};
	} finally {
		if (timeout) {
			clearTimeout(timeout);
		}
	}
}
