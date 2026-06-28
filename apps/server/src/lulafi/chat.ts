import {
	type ChatFormSubmissionMessage,
	type ChatMessage,
	type ChatRoomLookupInput,
	createChatClient,
	createOmemoEncryption,
	createRoomDirectory,
	storageBackends,
} from "@hubnet-systems/chat-sdk";
import { insertLulafiSubmissionIfNew } from "@membership-connector-app/api/lulafi-submission/service";
import { env } from "@membership-connector-app/env/server";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";

if (typeof globalThis.WebSocket === "undefined") {
	globalThis.WebSocket = WebSocket as typeof globalThis.WebSocket;
}

function buildFallbackRoomId(input: ChatRoomLookupInput) {
	return `peer:${input.userId}`;
}

function createFallbackRoomDirectory(app: FastifyInstance) {
	return createRoomDirectory({
		currentUserId: env.LULAFI_XMPP_USER_ID,
		xmppDomain: env.LULAFI_XMPP_DOMAIN,
		getOrCreateRoom: async (input) => {
			app.log.warn(
				{ userId: input.userId },
				"Using fallback LulaFi room lookup without peer fanout metadata",
			);

			return {
				roomId: buildFallbackRoomId(input),
				peerDeviceIds: [],
			};
		},
		getRoom: async (roomId) => ({
			roomId,
			peerDeviceIds: [],
		}),
	});
}

function hasChatConfig() {
	return Boolean(
		env.LULAFI_XMPP_DOMAIN &&
			env.LULAFI_XMPP_USER_ID &&
			env.LULAFI_XMPP_DEVICE_ID &&
			env.LULAFI_XMPP_PASSWORD,
	);
}

function getChatConnectionSummary() {
	return {
		xmppDomain: env.LULAFI_XMPP_DOMAIN ?? null,
		userId: env.LULAFI_XMPP_USER_ID ?? null,
		deviceId: env.LULAFI_XMPP_DEVICE_ID ?? null,
		resource: env.LULAFI_XMPP_RESOURCE,
		hasApiKey: Boolean(env.LULAFI_CHAT_API_KEY),
		debugEnabled: env.LULAFI_CHAT_DEBUG,
	};
}

function getObjectKeys(value: unknown) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return [];
	}

	return Object.keys(value);
}

function getMetadataMessageType(metadata: unknown) {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
		return null;
	}

	const messageType = (metadata as Record<string, unknown>).messageType;
	return typeof messageType === "string" ? messageType : null;
}

function summarizeInboundMessage(message: ChatMessage) {
	return {
		id: message.id,
		roomId: message.roomId,
		fromUserId: message.fromUserId,
		fromDeviceId: message.fromDeviceId,
		toDeviceId: message.toDeviceId,
		messageType: getMetadataMessageType(message.metadata),
		metadataKeys: getObjectKeys(message.metadata),
		rawKeys: getObjectKeys(message.raw),
		bodyLength: message.body.length,
		body: message.body,
	};
}

function summarizeFormSubmission(message: ChatFormSubmissionMessage) {
	return {
		...summarizeInboundMessage(message),
		formId: message.formId ?? null,
		formVersion:
			message.formVersion != null ? String(message.formVersion) : null,
		submissionRoomId: message.submissionRoomId ?? null,
		providerDirectMessageRoomId: message.providerDirectMessageRoomId ?? null,
		correlationId: message.correlationId ?? null,
		recordId: message.recordId ?? null,
		payloadKeys: getObjectKeys(message.payload),
		hasReadablePayload:
			Boolean(message.payload.readable) &&
			typeof message.payload.readable === "object" &&
			!Array.isArray(message.payload.readable),
		hasRawPayload:
			Boolean(message.payload.raw) &&
			typeof message.payload.raw === "object" &&
			!Array.isArray(message.payload.raw),
		fieldCount: message.fields.length,
		answerCount: Object.keys(message.answers).length,
		body: message.body,
	};
}

export function isSelfOriginatedSubmission(
	message: Pick<ChatFormSubmissionMessage, "fromDeviceId">,
	ownBareDeviceId: string | undefined,
) {
	return Boolean(ownBareDeviceId && message.fromDeviceId === ownBareDeviceId);
}

type ChatClientLike = ReturnType<typeof createChatClient>;

export function registerLulafiChatListeners({
	app,
	chatClient,
	debugEnabled = env.LULAFI_CHAT_DEBUG,
}: {
	app: FastifyInstance;
	chatClient: ChatClientLike;
	debugEnabled?: boolean;
}) {
	chatClient.onStatus((event) => {
		console.log(event, "event");
		app.log.info(
			{
				status: event.status,
				eventDeviceId: event.deviceId,
				currentDeviceId: chatClient.getDeviceId(),
				ownBareDeviceId: chatClient.getBareDeviceId(),
			},
			"LulaFi chat status changed",
		);
	});

	chatClient.onError((event) => {
		app.log.warn(
			{
				id: event.id,
				roomId: event.roomId,
				fromUserId: event.fromUserId,
				fromDeviceId: event.fromDeviceId,
				toDeviceId: event.toDeviceId,
				condition: event.condition,
				text: event.text,
				error: event.error,
				rawKeys: getObjectKeys(event.raw),
			},
			"LulaFi chat error event received",
		);
	});

	if (debugEnabled) {
		chatClient.onChatMessage((message) => {
			app.log.info(
				summarizeInboundMessage(message),
				"LulaFi inbound chat message received",
			);
		});

		chatClient.onChatMessage((message) => {
			app.log.info(
				{
					...summarizeInboundMessage(message),
					providerDirectMessageRoomId:
						message.providerDirectMessageRoomId ?? null,
					submissionRoomId: message.submissionRoomId ?? null,
					correlationId: message.correlationId ?? null,
					displayName: message.displayName ?? null,
				},
				"LulaFi inbound typed chat message received",
			);
		});
	}

	chatClient.onFormSubmission((message) => {
		const ownBareDeviceId = chatClient.getBareDeviceId();
		if (isSelfOriginatedSubmission(message, ownBareDeviceId)) {
			app.log.info(
				{
					id: message.id,
					fromDeviceId: message.fromDeviceId,
					ownBareDeviceId,
				},
				"Skipping self-originated LulaFi form submission",
			);
			return;
		}

		app.log.info(
			summarizeFormSubmission(message),
			"LulaFi form submission received",
		);

		void insertLulafiSubmissionIfNew(message)
			.then((result) => {
				app.log.info(
					{
						externalEventId: message.id,
						inserted: result.inserted,
						submissionId: result.submissionId,
					},
					"LulaFi submission processed",
				);
			})
			.catch((error) => {
				app.log.error(
					{
						err: error,
						externalEventId: message.id,
					},
					"Failed to persist LulaFi submission",
				);
			});
	});
}

export async function initializeLulafiChatClient({
	app,
	chatClient,
}: {
	app: FastifyInstance;
	chatClient: ChatClientLike;
}) {
	registerLulafiChatListeners({
		app,
		chatClient,
	});
	app.log.info(
		{
			connection: getChatConnectionSummary(),
		},
		"Connecting LulaFi chat client",
	);
	await chatClient.connect();
	app.log.info(
		{
			connection: getChatConnectionSummary(),
			currentDeviceId: chatClient.getDeviceId(),
			ownBareDeviceId: chatClient.getBareDeviceId(),
		},
		"LulaFi chat client connected",
	);
}

let chatClientSingleton: ChatClientLike | null = null;
let connectPromise: Promise<void> | null = null;
let shutdownListenerRegistered = false;

export function createLulafiChatClient(app: FastifyInstance) {
	const roomDirectory = createFallbackRoomDirectory(app);

	app.log.info(
		{
			connection: getChatConnectionSummary(),
		},
		"Creating LulaFi chat client",
	);

	return createChatClient({
		apiKey: env.LULAFI_CHAT_API_KEY ?? "",
		xmppDomain: env.LULAFI_XMPP_DOMAIN ?? "",
		userId: env.LULAFI_XMPP_USER_ID ?? "",
		deviceId: env.LULAFI_XMPP_DEVICE_ID ?? "",
		password: env.LULAFI_XMPP_PASSWORD ?? "",
		displayName: env.LULAFI_CHAT_DISPLAY_NAME,
		resource: env.LULAFI_XMPP_RESOURCE,
		autoReconnect: true,
		roomDirectory,
		logger: {
			debug: (message, data) => app.log.debug(data ?? {}, message),
			info: (message, data) => app.log.info(data ?? {}, message),
			warn: (message, data) => app.log.warn(data ?? {}, message),
			error: (message, data) => app.log.error(data ?? {}, message),
		},
		xmppWebSocketPath: "/chat/websocket",
		encryption: createOmemoEncryption({ storage: storageBackends.memory }),
	});
}

export async function startLulafiChatIngestion(app: FastifyInstance) {
	app.log.info(
		{
			connection: getChatConnectionSummary(),
		},
		"Starting LulaFi chat ingestion",
	);

	if (!hasChatConfig()) {
		app.log.warn(
			{
				connection: getChatConnectionSummary(),
			},
			"LulaFi chat is not configured; submission ingestion disabled",
		);
		return;
	}

	if (connectPromise) {
		app.log.info("Reusing in-flight LulaFi chat connection attempt");
		await connectPromise;
		return;
	}

	if (!chatClientSingleton) {
		chatClientSingleton = createLulafiChatClient(app);
	} else {
		app.log.info("Reusing existing LulaFi chat client singleton");
	}

	if (!shutdownListenerRegistered) {
		shutdownListenerRegistered = true;
		app.server.once("close", () => {
			app.log.info("Running LulaFi chat shutdown cleanup");
			if (chatClientSingleton) {
				void chatClientSingleton
					.stop()
					.catch((error) => {
						app.log.error(
							{
								err: error,
							},
							"Failed to stop LulaFi chat client during shutdown",
						);
					})
					.then(() => {
						app.log.info("Stopped LulaFi chat client during shutdown");
					});
			}
			chatClientSingleton = null;
			connectPromise = null;
			shutdownListenerRegistered = false;
		});
	}

	connectPromise = initializeLulafiChatClient({
		app,
		chatClient: chatClientSingleton,
	});
	await connectPromise;
}
