import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv: Record<string, unknown> = {};

vi.mock("@membership-connector-app/env/server", () => ({
	env: mockEnv,
}));

function resetEnv(overrides: Record<string, unknown> = {}) {
	for (const key of Object.keys(mockEnv)) {
		delete mockEnv[key];
	}

	Object.assign(mockEnv, {
		LULA_CHAT_API_KEY: "test-api-key",
		LULA_CHAT_XMPP_DOMAIN: "api.dev.lulafi.co",
		LULA_CHAT_USER_ID: "business-account-1",
		LULA_CHAT_DEVICE_ID: "device-1",
		LULA_CHAT_RESOURCE: "server-client",
		LULA_CHAT_AUTH_TYPE: "password",
		LULA_CHAT_PASSWORD: "secret",
		LULA_CHAT_DEFAULT_MEMBERSHIP_ID: "membership-1",
		LULA_CHAT_DEFAULT_TIER_ID: "tier-1",
		...overrides,
	});
}

describe("resolveLulafiChatConfig", () => {
	beforeEach(() => {
		resetEnv();
		vi.resetModules();
	});

	it("resolves a password-auth config", async () => {
		const { resolveLulafiChatConfig } = await import("./config");

		const config = resolveLulafiChatConfig();

		expect(config.connection).toMatchObject({
			authType: "password",
			password: "secret",
			resource: "server-client",
		});
		expect(config.defaultMembershipId).toBe("membership-1");
		expect(config.defaultTierId).toBe("tier-1");
	});

	it("resolves an x-oauth2 config", async () => {
		resetEnv({
			LULA_CHAT_AUTH_TYPE: "x-oauth2",
			LULA_CHAT_PASSWORD: undefined,
			LULA_CHAT_ACCESS_TOKEN: "token-123",
		});
		const { resolveLulafiChatConfig } = await import("./config");

		const config = resolveLulafiChatConfig();

		expect(config.connection).toMatchObject({
			authType: "x-oauth2",
			accessToken: "token-123",
		});
	});

	it("throws a clear error when a required credential is missing", async () => {
		resetEnv({ LULA_CHAT_PASSWORD: undefined });
		const { resolveLulafiChatConfig } = await import("./config");

		expect(() => resolveLulafiChatConfig()).toThrow(/LULA_CHAT_PASSWORD/);
	});

	it("throws when the resource is not a valid chat-sdk resource", async () => {
		resetEnv({ LULA_CHAT_RESOURCE: "not-a-real-resource" });
		const { resolveLulafiChatConfig } = await import("./config");

		expect(() => resolveLulafiChatConfig()).toThrow(/LULA_CHAT_RESOURCE/);
	});
});
