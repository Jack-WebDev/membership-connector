import Fastify, { type FastifyInstance } from "fastify";
import type { DestinationStream } from "pino";
import { createLogger } from "./observability/logger";
import { registerObservability } from "./observability/setup";
import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";

type BuildServerOptions = {
	logStream?: DestinationStream;
	disableProcessHandlers?: boolean;
};

let processHandlersRegistered = false;
let activeApp: FastifyInstance | null = null;

export async function buildServer(
	options: BuildServerOptions = {},
): Promise<FastifyInstance> {
	const app = Fastify({
		loggerInstance: createLogger(options.logStream),
		disableRequestLogging: true,
		routerOptions: {
			maxParamLength: 1000,
		},
		requestIdHeader: "x-request-id",
		genReqId(request) {
			const incomingId = request.headers["x-request-id"];
			return typeof incomingId === "string" ? incomingId : crypto.randomUUID();
		},
	}) as unknown as FastifyInstance;

	registerObservability(app);
	await registerPlugins(app);
	await registerRoutes(app);
	if (!options.disableProcessHandlers) {
		registerProcessHandlers(app);
	}

	return app;
}

function registerProcessHandlers(app: FastifyInstance) {
	activeApp = app;
	if (processHandlersRegistered) {
		return;
	}

	processHandlersRegistered = true;

	const shutdown = async (signal: string) => {
		activeApp?.log.info({ signal }, "Shutdown signal received");
		try {
			await activeApp?.close();
			activeApp?.log.info("Server closed gracefully");
			process.exit(0);
		} catch (err) {
			activeApp?.log.error({ err }, "Error during shutdown");
			process.exit(1);
		}
	};

	const crash = async (
		type: "uncaughtException" | "unhandledRejection",
		err: unknown,
	) => {
		activeApp?.log.fatal({ err, type }, "Fatal process error");
		try {
			await activeApp?.close();
		} finally {
			process.exit(1);
		}
	};

	process.once("SIGINT", () => shutdown("SIGINT"));
	process.once("SIGTERM", () => shutdown("SIGTERM"));
	process.once("uncaughtException", (err) => {
		void crash("uncaughtException", err);
	});
	process.once("unhandledRejection", (err) => {
		void crash("unhandledRejection", err);
	});
}
