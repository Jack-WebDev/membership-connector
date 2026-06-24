import { type ChatResource, chatResources } from "@hubnet-systems/chat-sdk";
import { env } from "@membership-connector-app/env/server";

export type LulafiChatConnectionConfig = {
	apiKey: string;
	xmppDomain: string;
	userId: string;
	deviceId: string;
	resource: ChatResource;
} & (
	| { authType: "password"; password: string }
	| { authType: "x-oauth2"; accessToken: string }
);

export type LulafiChatConfig = {
	connection: LulafiChatConnectionConfig;
	defaultMembershipId: string;
	defaultTierId: string;
};

function requireEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(
			`Missing required env var for LulaFi chat listener: ${name}`,
		);
	}

	return value;
}

function resolveResource(value: string): ChatResource {
	if (!(chatResources as readonly string[]).includes(value)) {
		throw new Error(
			`LULA_CHAT_RESOURCE must be one of ${chatResources.join(", ")}, got "${value}"`,
		);
	}

	return value as ChatResource;
}

export function resolveLulafiChatConfig(): LulafiChatConfig {
	const apiKey = requireEnv("LULA_CHAT_API_KEY", env.LULA_CHAT_API_KEY);
	const xmppDomain = requireEnv(
		"LULA_CHAT_XMPP_DOMAIN",
		env.LULA_CHAT_XMPP_DOMAIN,
	);
	const userId = requireEnv("LULA_CHAT_USER_ID", env.LULA_CHAT_USER_ID);
	const deviceId = requireEnv("LULA_CHAT_DEVICE_ID", env.LULA_CHAT_DEVICE_ID);
	const resource = resolveResource(env.LULA_CHAT_RESOURCE);
	const defaultMembershipId = requireEnv(
		"LULA_CHAT_DEFAULT_MEMBERSHIP_ID",
		env.LULA_CHAT_DEFAULT_MEMBERSHIP_ID,
	);
	const defaultTierId = requireEnv(
		"LULA_CHAT_DEFAULT_TIER_ID",
		env.LULA_CHAT_DEFAULT_TIER_ID,
	);

	const base = { apiKey, xmppDomain, userId, deviceId, resource };

	if (env.LULA_CHAT_AUTH_TYPE === "x-oauth2") {
		return {
			connection: {
				...base,
				authType: "x-oauth2",
				accessToken: requireEnv(
					"LULA_CHAT_ACCESS_TOKEN",
					env.LULA_CHAT_ACCESS_TOKEN,
				),
			},
			defaultMembershipId,
			defaultTierId,
		};
	}

	return {
		connection: {
			...base,
			authType: "password",
			password: requireEnv("LULA_CHAT_PASSWORD", env.LULA_CHAT_PASSWORD),
		},
		defaultMembershipId,
		defaultTierId,
	};
}
