import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	initializeLulafiChatClient,
	isSelfOriginatedSubmission,
	registerLulafiChatListeners,
} from "./chat";

function createAppLogger() {
	return {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};
}

function createChatClientDouble() {
	const listeners: {
		message: ((value: unknown) => void)[];
		chat: ((value: unknown) => void)[];
		status: ((value: unknown) => void)[];
		error: ((value: unknown) => void)[];
		form: ((value: unknown) => void)[];
	} = {
		message: [],
		chat: [],
		status: [],
		error: [],
		form: [],
	};

	return {
		listeners,
		connect: vi.fn().mockResolvedValue(undefined),
		stop: vi.fn().mockResolvedValue(undefined),
		onMessage: vi.fn((listener) => {
			listeners.message.push(listener);
			return () => undefined;
		}),
		onChatMessage: vi.fn((listener) => {
			listeners.chat.push(listener);
			return () => undefined;
		}),
		onStatus: vi.fn((listener) => {
			listeners.status.push(listener);
			return () => undefined;
		}),
		onError: vi.fn((listener) => {
			listeners.error.push(listener);
			return () => undefined;
		}),
		onFormSubmission: vi.fn((listener) => {
			listeners.form.push(listener);
			return () => undefined;
		}),
		getDeviceId: vi.fn(() => "self-device"),
		getBareDeviceId: vi.fn(() => "self-device"),
	};
}

describe("isSelfOriginatedSubmission", () => {
	it("returns true for self-originated events", () => {
		expect(
			isSelfOriginatedSubmission(
				{ fromDeviceId: "self-device" },
				"self-device",
			),
		).toBe(true);
	});
});

describe("registerLulafiChatListeners", () => {
	let app: { log: ReturnType<typeof createAppLogger> };

	beforeEach(() => {
		app = { log: createAppLogger() };
	});

	it("registers status, error, and form listeners", () => {
		const chatClient = createChatClientDouble();

		registerLulafiChatListeners({
			app: app as never,
			chatClient: chatClient as never,
			debugEnabled: false,
		});

		expect(chatClient.onStatus).toHaveBeenCalledTimes(1);
		expect(chatClient.onError).toHaveBeenCalledTimes(1);
		expect(chatClient.onFormSubmission).toHaveBeenCalledTimes(1);
		expect(chatClient.onMessage).not.toHaveBeenCalled();
		expect(chatClient.onChatMessage).not.toHaveBeenCalled();
	});

	it("registers debug inbound listeners when chat debug logging is enabled", () => {
		const chatClient = createChatClientDouble();

		registerLulafiChatListeners({
			app: app as never,
			chatClient: chatClient as never,
			debugEnabled: true,
		});

		expect(chatClient.onMessage).toHaveBeenCalledTimes(1);
		expect(chatClient.onChatMessage).toHaveBeenCalledTimes(1);
	});

	it("registers listeners before connect", async () => {
		const chatClient = createChatClientDouble();
		const sequence: string[] = [];

		chatClient.onStatus.mockImplementation((listener) => {
			sequence.push("status");
			chatClient.listeners.status.push(listener);
			return () => undefined;
		});
		chatClient.onError.mockImplementation((listener) => {
			sequence.push("error");
			chatClient.listeners.error.push(listener);
			return () => undefined;
		});
		chatClient.onFormSubmission.mockImplementation((listener) => {
			sequence.push("form");
			chatClient.listeners.form.push(listener);
			return () => undefined;
		});
		chatClient.connect.mockImplementation(async () => {
			sequence.push("connect");
		});

		await initializeLulafiChatClient({
			app: app as never,
			chatClient: chatClient as never,
		});

		expect(sequence).toEqual(["status", "error", "form", "connect"]);
		expect(app.log.info).toHaveBeenCalledWith(
			expect.objectContaining({
				connection: expect.any(Object),
			}),
			"Connecting LulaFi chat client",
		);
		expect(app.log.info).toHaveBeenCalledWith(
			expect.objectContaining({
				connection: expect.any(Object),
				currentDeviceId: "self-device",
				ownBareDeviceId: "self-device",
			}),
			"LulaFi chat client connected",
		);
	});

	it("logs self-originated form submissions and skips persistence", () => {
		const chatClient = createChatClientDouble();

		registerLulafiChatListeners({
			app: app as never,
			chatClient: chatClient as never,
			debugEnabled: false,
		});

		chatClient.listeners.form[0]?.({
			id: "message-1",
			fromDeviceId: "self-device",
		});

		expect(app.log.info).toHaveBeenCalledWith(
			{
				id: "message-1",
				fromDeviceId: "self-device",
				ownBareDeviceId: "self-device",
			},
			"Skipping self-originated LulaFi form submission",
		);
	});

	it("logs safe error details from the SDK error event", () => {
		const chatClient = createChatClientDouble();

		registerLulafiChatListeners({
			app: app as never,
			chatClient: chatClient as never,
			debugEnabled: false,
		});

		chatClient.listeners.error[0]?.({
			id: "err-1",
			roomId: "room-1",
			fromUserId: "user-1",
			fromDeviceId: "device-1",
			toDeviceId: "device-2",
			condition: "service-unavailable",
			text: "Something went wrong",
			error: new Error("boom"),
			raw: { foo: "bar" },
		});

		expect(app.log.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "err-1",
				roomId: "room-1",
				fromUserId: "user-1",
				fromDeviceId: "device-1",
				toDeviceId: "device-2",
				condition: "service-unavailable",
				text: "Something went wrong",
				rawKeys: ["foo"],
			}),
			"LulaFi chat error event received",
		);
	});
});
