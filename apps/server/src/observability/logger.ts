import { env } from "@membership-connector-app/env/server";
import type {
	LogEntry,
	LoggerAdapter,
} from "@membership-connector-app/observability";
import type { FastifyBaseLogger } from "fastify";
import pino, { type DestinationStream, type LoggerOptions } from "pino";

const REDACT_PATHS = [
	"req.headers.authorization",
	"req.headers.cookie",
	"req.headers.set-cookie",
	"headers.authorization",
	"headers.cookie",
	"headers.set-cookie",
	"authorization",
	"cookie",
	"set-cookie",
	"password",
	"token",
	"otp",
	"body.password",
	"body.token",
	"body.otp",
	"body.secret",
	"databaseUrl",
	"db.connectionString",
	"error.config.headers.authorization",
];

export function createLogger(stream?: DestinationStream) {
	const options: LoggerOptions = {
		level: env.LOG_LEVEL,
		base: {
			service: env.SERVICE_NAME,
			env: env.NODE_ENV,
			version: env.APP_VERSION,
		},
		timestamp: pino.stdTimeFunctions.isoTime,
		messageKey: "message",
		errorKey: "error",
		redact: env.LOG_REDACT
			? {
					paths: REDACT_PATHS,
					censor: "[REDACTED]",
				}
			: undefined,
		formatters: {
			level(label) {
				return { level: label };
			},
		},
		transport:
			env.NODE_ENV === "development" || env.LOG_PRETTY
				? {
						target: "pino-pretty",
						options: {
							colorize: true,
							translateTime: "SYS:standard",
						},
					}
				: undefined,
	};

	return stream ? pino(options, stream) : pino(options);
}

export function createLoggerAdapter(logger: FastifyBaseLogger): LoggerAdapter {
	return {
		emit(entry: LogEntry) {
			const { level, message, timestamp: _timestamp, ...fields } = entry;
			logger[level](fields, message);
		},
	};
}
