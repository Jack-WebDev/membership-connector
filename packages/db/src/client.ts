import { env } from "@membership-connector-app/env/server";
import {
	elapsedMs,
	logDebug,
	logError,
	logWarn,
	nowMs,
} from "@membership-connector-app/observability";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getErrorCode, recordDbMetric, withDbInstrumentation } from "./helpers";
import * as schema from "./schema";

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

const originalQuery = pool.query.bind(pool);

pool.query = (async (...args: Parameters<typeof originalQuery>) => {
	const startedAt = nowMs();

	try {
		const result = await originalQuery(...args);
		const durationMs = elapsedMs(startedAt);

		recordDbMetric({
			operation: "query",
			status: "ok",
			durationMs,
		});

		if (durationMs >= env.DB_SLOW_QUERY_THRESHOLD_MS) {
			logWarn("db.query.slow", {
				dependency: "postgres",
				durationMs,
			});
		} else {
			logDebug("db.query.completed", {
				dependency: "postgres",
				durationMs,
			});
		}

		return result;
	} catch (err) {
		const durationMs = elapsedMs(startedAt);
		const errorCode = getErrorCode(err, "DB_QUERY_FAILED");

		recordDbMetric({
			operation: "query",
			status: "error",
			durationMs,
			errorCode,
		});

		logError("db.query.failed", {
			err,
			dependency: "postgres",
			durationMs,
			errorCode,
		});

		throw err;
	}
}) as typeof pool.query;

export { originalQuery, withDbInstrumentation };
