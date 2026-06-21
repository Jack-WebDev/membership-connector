import { createHash } from "node:crypto";
import {
	createSpanId,
	createTraceId,
	elapsedMs,
	enterObservabilityContext,
	logError,
	logInfo,
	logWarn,
	recordHttpRequestMetric,
	setLoggerAdapter,
	updateObservabilityContext,
} from "@membership-connector-app/observability";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { normalizeServerError, routeLabel } from "./errors";
import { createLoggerAdapter } from "./logger";

type ObservedRequest = FastifyRequest & {
	requestStartMs?: number;
	requestTraceId?: string;
	requestSpanId?: string;
};

export function registerObservability(app: FastifyInstance) {
	setLoggerAdapter(createLoggerAdapter(app.log));

	app.addHook("onRequest", async (request, reply) => {
		const observedRequest = request as ObservedRequest;
		const requestId = request.headers["x-request-id"] ?? request.id;
		const traceId =
			typeof requestId === "string"
				? hashToTraceId(requestId)
				: createTraceId();
		const spanId = createSpanId();

		observedRequest.requestStartMs = performance.now();
		observedRequest.requestTraceId = traceId;
		observedRequest.requestSpanId = spanId;

		reply.header("x-request-id", requestId);

		enterObservabilityContext({
			requestId: String(requestId),
			traceId,
			spanId,
			method: request.method,
			route: routeLabel(request),
			remoteIp: request.ip,
			userAgent: headerToString(request.headers["user-agent"]),
		});

		logInfo("request.received", {
			method: request.method,
			route: routeLabel(request),
			remoteIp: request.ip,
			userAgent: headerToString(request.headers["user-agent"]),
		});
	});

	app.addHook("preHandler", async (request) => {
		const observedRequest = request as ObservedRequest;
		const requestId =
			headerToString(request.headers["x-request-id"]) ?? request.id;
		updateObservabilityContext({
			requestId,
			traceId: observedRequest.requestTraceId,
			spanId: observedRequest.requestSpanId,
			method: request.method,
			route: routeLabel(request),
			remoteIp: request.ip,
			userAgent: headerToString(request.headers["user-agent"]),
		});
	});

	app.addHook("onResponse", async (request, reply) => {
		const observedRequest = request as ObservedRequest;
		const requestId =
			headerToString(request.headers["x-request-id"]) ?? request.id;
		const durationMs = elapsedMs(
			observedRequest.requestStartMs ?? performance.now(),
		);
		const route = routeLabel(request);

		updateObservabilityContext({
			requestId,
			traceId: observedRequest.requestTraceId,
			spanId: observedRequest.requestSpanId,
			method: request.method,
			route,
			statusCode: reply.statusCode,
			durationMs,
		});

		recordHttpRequestMetric({
			method: request.method,
			route,
			statusCode: reply.statusCode,
			durationMs,
		});

		logInfo("request.completed", {
			method: request.method,
			route,
			statusCode: reply.statusCode,
			durationMs,
		});
	});

	app.addHook("onError", async (request, reply, error) => {
		const observedRequest = request as ObservedRequest;
		const requestId =
			headerToString(request.headers["x-request-id"]) ?? request.id;
		const durationMs = elapsedMs(
			observedRequest.requestStartMs ?? performance.now(),
		);
		const normalized = normalizeServerError(error);

		updateObservabilityContext({
			requestId,
			traceId: observedRequest.requestTraceId,
			spanId: observedRequest.requestSpanId,
			method: request.method,
			route: routeLabel(request),
			statusCode: reply.statusCode || normalized.statusCode,
			durationMs,
			errorCode: normalized.code,
		});

		const fields = {
			err: error,
			method: request.method,
			route: routeLabel(request),
			statusCode: reply.statusCode || normalized.statusCode,
			durationMs,
			errorCode: normalized.code,
		};

		if (normalized.level === "warn") {
			logWarn("request.failed", fields);
			return;
		}

		logError("request.failed", fields);
	});

	app.setNotFoundHandler(async (request, reply) => {
		const requestId =
			headerToString(request.headers["x-request-id"]) ?? request.id;
		updateObservabilityContext({
			requestId,
			method: request.method,
			route: "unmatched",
			statusCode: 404,
			errorCode: "ROUTE_NOT_FOUND",
		});

		logWarn("request.not_found", {
			method: request.method,
			route: request.url,
			errorCode: "ROUTE_NOT_FOUND",
		});

		return reply.status(404).send({
			error: "Route not found",
			code: "ROUTE_NOT_FOUND",
			requestId,
		});
	});

	app.setErrorHandler(async (error, request, reply) => {
		const normalized = normalizeServerError(error);
		const requestId =
			headerToString(request.headers["x-request-id"]) ?? request.id;

		updateObservabilityContext({
			requestId,
			method: request.method,
			route: routeLabel(request),
			statusCode: normalized.statusCode,
			errorCode: normalized.code,
		});

		if (normalized.level === "warn") {
			logWarn("request.error_response", {
				err: error,
				statusCode: normalized.statusCode,
				errorCode: normalized.code,
			});
		} else {
			logError("request.error_response", {
				err: error,
				statusCode: normalized.statusCode,
				errorCode: normalized.code,
			});
		}

		return reply.status(normalized.statusCode).send({
			error: normalized.message,
			code: normalized.code,
			requestId,
		});
	});
}

function hashToTraceId(value: string) {
	return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function headerToString(value: string | string[] | undefined) {
	return Array.isArray(value) ? value.join(",") : value;
}
