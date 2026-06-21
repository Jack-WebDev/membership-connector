import type { FastifyError, FastifyRequest } from "fastify";

export type NormalizedError = {
	statusCode: number;
	code: string;
	message: string;
	level: "warn" | "error";
};

export function normalizeServerError(
	error: FastifyError | Error | unknown,
): NormalizedError {
	const statusCode =
		typeof (error as { statusCode?: unknown }).statusCode === "number"
			? (error as { statusCode: number }).statusCode
			: 500;
	const code =
		typeof (error as { code?: unknown }).code === "string"
			? (error as { code: string }).code
			: statusCode >= 500
				? "INTERNAL_SERVER_ERROR"
				: "REQUEST_FAILED";

	const fallbackMessage =
		statusCode >= 500 ? "Internal Server Error" : "Request failed";
	const message =
		statusCode >= 500
			? fallbackMessage
			: error instanceof Error && error.message
				? error.message
				: fallbackMessage;

	return {
		statusCode,
		code,
		message,
		level: statusCode >= 500 ? "error" : "warn",
	};
}

export function routeLabel(request: FastifyRequest) {
	return request.routeOptions.url || "unmatched";
}
