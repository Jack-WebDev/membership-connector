import {
	elapsedMs,
	nowMs,
	recordDependencyMetric,
} from "@membership-connector-app/observability";

export function getErrorCode(err: unknown, fallback: string): string {
	if (
		typeof err === "object" &&
		err !== null &&
		"code" in err &&
		typeof (err as { code?: unknown }).code === "string"
	) {
		return (err as { code: string }).code;
	}

	return fallback;
}

export function recordDbMetric(params: {
	operation: "query" | "healthcheck";
	status: "ok" | "error";
	durationMs: number;
	errorCode?: string;
}) {
	recordDependencyMetric({
		dependency: "postgres",
		operation: params.operation,
		status: params.status,
		durationMs: params.durationMs,
		errorCode: params.errorCode,
	});
}

export async function withDbInstrumentation<T>(
	operation: "query" | "healthcheck",
	run: () => Promise<T>,
) {
	const startedAt = nowMs();

	try {
		const result = await run();
		const durationMs = elapsedMs(startedAt);

		recordDbMetric({
			operation,
			status: "ok",
			durationMs,
		});

		return { result, durationMs };
	} catch (err) {
		const durationMs = elapsedMs(startedAt);
		const errorCode = getErrorCode(
			err,
			operation === "healthcheck" ? "DB_HEALTHCHECK_FAILED" : "DB_QUERY_FAILED",
		);

		recordDbMetric({
			operation,
			status: "error",
			durationMs,
			errorCode,
		});

		throw {
			err,
			durationMs,
			errorCode,
		};
	}
}
