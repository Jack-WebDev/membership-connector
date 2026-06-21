import { AsyncLocalStorage } from "node:async_hooks";

export type ObservabilityContext = {
	service?: string;
	env?: string;
	version?: string;
	requestId?: string;
	traceId?: string;
	spanId?: string;
	route?: string;
	method?: string;
	statusCode?: number;
	durationMs?: number;
	userId?: string;
	workspaceId?: string;
	workspaceSlug?: string;
	remoteIp?: string;
	userAgent?: string;
	dependency?: string;
	errorCode?: string;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = ObservabilityContext & {
	level: LogLevel;
	message: string;
	timestamp: string;
	error?: {
		name: string;
		message: string;
		stack?: string;
		code?: string;
	};
	[key: string]: unknown;
};

export type LoggerAdapter = {
	emit(entry: LogEntry): void;
};

type MetricKey = string;

type CounterMetric = {
	type: "counter";
	name: string;
	description: string;
	values: Map<MetricKey, number>;
};

type HistogramMetric = {
	type: "histogram";
	name: string;
	description: string;
	values: Map<
		MetricKey,
		{
			count: number;
			sum: number;
			min: number;
			max: number;
		}
	>;
};

const contextStorage = new AsyncLocalStorage<ObservabilityContext>();

const counters = new Map<string, CounterMetric>();
const histograms = new Map<string, HistogramMetric>();

const defaultLogger: LoggerAdapter = {
	emit(entry) {
		const stream =
			entry.level === "error" || entry.level === "warn"
				? process.stderr
				: process.stdout;
		stream.write(`${JSON.stringify(entry)}\n`);
	},
};

let loggerAdapter: LoggerAdapter = defaultLogger;

function getCounter(name: string, description: string) {
	let metric = counters.get(name);
	if (!metric) {
		metric = {
			type: "counter",
			name,
			description,
			values: new Map(),
		};
		counters.set(name, metric);
	}
	return metric;
}

function getHistogram(name: string, description: string) {
	let metric = histograms.get(name);
	if (!metric) {
		metric = {
			type: "histogram",
			name,
			description,
			values: new Map(),
		};
		histograms.set(name, metric);
	}
	return metric;
}

function metricKey(
	attributes: Record<string, string | number | boolean | undefined>,
) {
	return JSON.stringify(
		Object.entries(attributes)
			.filter(([, value]) => value !== undefined)
			.sort(([left], [right]) => left.localeCompare(right)),
	);
}

function parseMetricKey(key: MetricKey) {
	return Object.fromEntries(JSON.parse(key) as Array<[string, unknown]>);
}

function serializeError(error: unknown) {
	if (!(error instanceof Error)) {
		return {
			name: "NonError",
			message: typeof error === "string" ? error : "Unknown error",
		};
	}

	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
		code:
			typeof (error as unknown as { code?: unknown }).code === "string"
				? (error as unknown as { code: string }).code
				: undefined,
	};
}

export function setLoggerAdapter(adapter: LoggerAdapter) {
	loggerAdapter = adapter;
}

export function resetLoggerAdapter() {
	loggerAdapter = defaultLogger;
}

export function getObservabilityContext() {
	return contextStorage.getStore() ?? {};
}

export function enterObservabilityContext(context: ObservabilityContext) {
	const current = getObservabilityContext();
	contextStorage.enterWith({
		...current,
		...context,
	});
}

export function updateObservabilityContext(context: ObservabilityContext) {
	enterObservabilityContext(context);
}

export async function runWithObservabilityContext<T>(
	context: ObservabilityContext,
	callback: () => Promise<T> | T,
) {
	return contextStorage.run(
		{
			...getObservabilityContext(),
			...context,
		},
		callback,
	);
}

export function emitLog(
	level: LogLevel,
	message: string,
	fields?: Record<string, unknown>,
) {
	const error =
		fields && "err" in fields ? (fields.err as unknown) : fields?.error;

	const entry: LogEntry = {
		level,
		message,
		timestamp: new Date().toISOString(),
		...getObservabilityContext(),
		...(fields ?? {}),
	};

	if (error !== undefined) {
		delete entry.err;
		entry.error = serializeError(error);
	}

	loggerAdapter.emit(entry);
}

export const logDebug = (message: string, fields?: Record<string, unknown>) =>
	emitLog("debug", message, fields);

export const logInfo = (message: string, fields?: Record<string, unknown>) =>
	emitLog("info", message, fields);

export const logWarn = (message: string, fields?: Record<string, unknown>) =>
	emitLog("warn", message, fields);

export const logError = (message: string, fields?: Record<string, unknown>) =>
	emitLog("error", message, fields);

export function incrementCounter(
	name: string,
	description: string,
	attributes: Record<string, string | number | boolean | undefined>,
	value = 1,
) {
	const metric = getCounter(name, description);
	const key = metricKey(attributes);
	metric.values.set(key, (metric.values.get(key) ?? 0) + value);
}

export function recordHistogram(
	name: string,
	description: string,
	attributes: Record<string, string | number | boolean | undefined>,
	value: number,
) {
	const metric = getHistogram(name, description);
	const key = metricKey(attributes);
	const current = metric.values.get(key);
	if (!current) {
		metric.values.set(key, {
			count: 1,
			sum: value,
			min: value,
			max: value,
		});
		return;
	}

	current.count += 1;
	current.sum += value;
	current.min = Math.min(current.min, value);
	current.max = Math.max(current.max, value);
}

export function recordHttpRequestMetric(input: {
	method: string;
	route: string;
	statusCode: number;
	durationMs: number;
}) {
	const labels = {
		method: input.method,
		route: input.route,
		statusCode: input.statusCode,
		statusClass: `${Math.floor(input.statusCode / 100)}xx`,
	};

	incrementCounter(
		"http.server.requests",
		"Total HTTP server requests by route and status code.",
		labels,
	);
	recordHistogram(
		"http.server.duration",
		"HTTP server request duration in milliseconds.",
		labels,
		input.durationMs,
	);
}

export function recordProcedureMetric(input: {
	procedure: string;
	type: string;
	status: "ok" | "error";
	durationMs: number;
	errorCode?: string;
}) {
	const labels = {
		procedure: input.procedure,
		type: input.type,
		status: input.status,
		errorCode: input.errorCode,
	};

	incrementCounter(
		"trpc.requests",
		"Total tRPC procedure calls by procedure and outcome.",
		labels,
	);
	recordHistogram(
		"trpc.duration",
		"tRPC procedure duration in milliseconds.",
		labels,
		input.durationMs,
	);
}

export function recordDependencyMetric(input: {
	dependency: string;
	operation: string;
	status: "ok" | "error" | "warn";
	durationMs: number;
	errorCode?: string;
}) {
	const labels = {
		dependency: input.dependency,
		operation: input.operation,
		status: input.status,
		errorCode: input.errorCode,
	};

	incrementCounter(
		"dependency.calls",
		"External dependency calls by dependency and outcome.",
		labels,
	);
	recordHistogram(
		"dependency.duration",
		"External dependency call duration in milliseconds.",
		labels,
		input.durationMs,
	);
}

export function recordReadinessMetric(input: {
	check: string;
	status: "ok" | "warn" | "fail";
	durationMs: number;
}) {
	const labels = {
		check: input.check,
		status: input.status,
	};

	incrementCounter(
		"readiness.checks",
		"Readiness checks by component and outcome.",
		labels,
	);
	recordHistogram(
		"readiness.duration",
		"Readiness check duration in milliseconds.",
		labels,
		input.durationMs,
	);
}

export function getMetricsSnapshot() {
	return {
		counters: Array.from(counters.values()).map((metric) => ({
			name: metric.name,
			description: metric.description,
			type: metric.type,
			series: Array.from(metric.values.entries()).map(([key, value]) => ({
				attributes: parseMetricKey(key),
				value,
			})),
		})),
		histograms: Array.from(histograms.values()).map((metric) => ({
			name: metric.name,
			description: metric.description,
			type: metric.type,
			series: Array.from(metric.values.entries()).map(([key, value]) => ({
				attributes: parseMetricKey(key),
				...value,
				avg: value.count === 0 ? 0 : value.sum / value.count,
			})),
		})),
	};
}

export function resetMetrics() {
	counters.clear();
	histograms.clear();
}

export function createTraceId() {
	return randomHex(32);
}

export function createSpanId() {
	return randomHex(16);
}

function randomHex(length: number) {
	const bytes = crypto.getRandomValues(new Uint8Array(length / 2));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

export function nowMs() {
	return performance.now();
}

export function elapsedMs(startMs: number) {
	return Number((performance.now() - startMs).toFixed(3));
}
