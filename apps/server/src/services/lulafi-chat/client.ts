import {
	type ChatFormSubmissionField,
	createOmemoEncryption,
	init,
	storageBackends,
} from "@hubnet-systems/chat-sdk";
import { logError, logInfo } from "@membership-connector-app/observability";

import { resolveLulafiChatConfig } from "./config";
import { processLulafiFormSubmission } from "./pipeline";

export type LulafiFormSubmissionPayload = {
	id: string;
	correlationId?: string;
	fromUserId: string;
	displayName?: string;
	formId?: string;
	submissionRoomId?: string;
	recordId?: string;
	formVersion?: number;
	submittedAt?: string;
	timestamp: number;
	answers: Record<string, string>;
	fields: ChatFormSubmissionField[];
	payload: Record<string, unknown>;
};

export function createLulafiChatListener() {
	let client: ReturnType<typeof init> | null = null;

	async function start() {
		const config = resolveLulafiChatConfig();

		client = init({
			apiKey: config.connection.apiKey,
			xmppDomain: config.connection.xmppDomain,
			userId: config.connection.userId,
			deviceId: config.connection.deviceId,
			resource: config.connection.resource,
			encryption: createOmemoEncryption({ storage: storageBackends.memory }),
			...(config.connection.authType === "x-oauth2"
				? {
						authType: "x-oauth2" as const,
						accessToken: config.connection.accessToken,
					}
				: { password: config.connection.password }),
		});

		client.onFormSubmission((message) => {
			const safePayload: LulafiFormSubmissionPayload = {
				id: message.id,
				correlationId: message.correlationId,
				fromUserId: message.fromUserId,
				displayName: message.displayName,
				formId: message.formId,
				submissionRoomId: message.submissionRoomId,
				recordId: message.recordId,
				formVersion: message.formVersion,
				submittedAt: message.submittedAt,
				timestamp: message.timestamp,
				answers: message.answers,
				fields: message.fields,
				payload: message.payload,
			};

			const externalId = message.correlationId ?? message.id;

			processLulafiFormSubmission(safePayload, externalId, {
				defaultMembershipId: config.defaultMembershipId,
				defaultTierId: config.defaultTierId,
			}).catch((error) => {
				logError("lulafi.chat.listener.handler_failed", {
					err: error,
					errorCode: "LULAFI_CHAT_HANDLER_FAILED",
					externalId,
				});
			});
		});

		try {
			await client.connect();
			logInfo("lulafi.chat.listener.connected", {});
		} catch (error) {
			logError("lulafi.chat.listener.connect_failed", {
				err: error,
				errorCode: "LULAFI_CHAT_CONNECT_FAILED",
			});
		}
	}

	async function stop() {
		if (!client) {
			return;
		}

		try {
			await client.stop();
		} catch (error) {
			logError("lulafi.chat.listener.stop_failed", {
				err: error,
				errorCode: "LULAFI_CHAT_STOP_FAILED",
			});
		} finally {
			client = null;
		}
	}

	return { start, stop };
}
