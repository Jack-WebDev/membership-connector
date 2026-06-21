import fastifyRateLimit from "@fastify/rate-limit";
import { auth } from "@membership-connector-app/auth";
import { env } from "@membership-connector-app/env/server";
import { logError, logInfo } from "@membership-connector-app/observability";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// Sensitive auth endpoints that are high-value abuse targets.
// Limits are per-IP and override the global server rate limit.
const AUTH_RATE_LIMITS = [
	// Sign-in and sign-up: brute-force and credential-stuffing targets
	{
		patterns: ["/sign-in/*", "/sign-up/*"],
		max: 10,
		timeWindow: "1 minute",
	},
	// OTP, password reset: enumeration and SMS-pumping targets
	{
		patterns: ["/otp/*", "/email-otp/*", "/forget-password", "/reset-password"],
		max: 5,
		timeWindow: "1 minute",
	},
] as const;

// Remaining auth traffic (session reads, sign-out, OAuth callbacks, etc.)
const AUTH_CATCHALL_LIMIT = { max: 30, timeWindow: "1 minute" } as const;

async function forwardToAuthHandler(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	let url: URL;
	try {
		url = new URL(request.raw.url ?? request.url, env.BETTER_AUTH_URL);
	} catch (err) {
		logError("auth.request.invalid_url", {
			err,
			route: request.routeOptions.url,
			method: request.method,
			errorCode: "AUTH_REQUEST_INVALID_URL",
		});
		return reply.status(500).send({
			error: "Internal authentication error",
			code: "AUTH_REQUEST_INVALID_URL",
			requestId: request.id,
		});
	}

	const headers = new Headers();
	for (const [key, value] of Object.entries(request.headers)) {
		if (key === "content-length" || value === undefined) {
			continue;
		}

		if (Array.isArray(value)) {
			value.forEach((v) => {
				headers.append(key, v);
			});
		} else {
			headers.set(key, value);
		}
	}

	const hasBody = request.method !== "GET" && request.method !== "HEAD";
	const requestBody =
		hasBody && request.body != null
			? typeof request.body === "string" || request.body instanceof Uint8Array
				? request.body
				: JSON.stringify(request.body)
			: undefined;

	let req: Request;
	try {
		req = new Request(url.toString(), {
			method: request.method,
			headers,
			body: requestBody,
		});
	} catch (err) {
		logError("auth.request.forward_build_failed", {
			err,
			route: request.routeOptions.url,
			method: request.method,
			errorCode: "AUTH_FORWARD_REQUEST_BUILD_FAILED",
		});
		return reply.status(500).send({
			error: "Internal authentication error",
			code: "AUTH_FORWARD_REQUEST_BUILD_FAILED",
			requestId: request.id,
		});
	}

	let response: Response;
	try {
		response = await auth.handler(req);
	} catch (err) {
		logError("auth.request.handler_failed", {
			err,
			method: request.method,
			route: request.routeOptions.url,
			authUrl: url.toString(),
			errorCode: "AUTH_HANDLER_FAILURE",
		});
		return reply.status(500).send({
			error: "Internal authentication error",
			code: "AUTH_HANDLER_FAILURE",
			requestId: request.id,
		});
	}

	try {
		reply.status(response.status);
		response.headers.forEach((value, key) => {
			reply.header(key, value);
		});
		const responseBody = response.body ? await response.text() : null;
		logInfo("auth.request.completed", {
			method: request.method,
			route: request.routeOptions.url,
			statusCode: response.status,
		});
		return reply.send(responseBody);
	} catch (err) {
		logError("auth.request.response_serialization_failed", {
			err,
			method: request.method,
			route: request.routeOptions.url,
			statusCode: response.status,
			errorCode: "AUTH_RESPONSE_SERIALIZATION_FAILED",
		});
		return reply.status(500).send({
			error: "Internal authentication error",
			code: "AUTH_RESPONSE_SERIALIZATION_FAILED",
			requestId: request.id,
		});
	}
}

export async function authRoutes(app: FastifyInstance) {
	await app.register(fastifyRateLimit, {
		global: false,
		errorResponseBuilder: (_request: FastifyRequest, context) => ({
			statusCode: context.statusCode,
			error: "Too Many Requests",
			code: "RATE_LIMITED",
			retryAfter: context.after,
		}),
	});

	// Register specific sensitive routes first so they match before the catch-all.
	for (const { patterns, max, timeWindow } of AUTH_RATE_LIMITS) {
		for (const pattern of patterns) {
			app.route({
				method: ["GET", "POST"],
				url: pattern,
				config: { rateLimit: { max, timeWindow } },
				handler: forwardToAuthHandler,
			});
		}
	}

	// Catch-all for all other auth traffic with a moderate per-auth limit.
	app.route({
		method: ["GET", "POST"],
		url: "/*",
		config: { rateLimit: AUTH_CATCHALL_LIMIT },
		handler: forwardToAuthHandler,
	});
}
