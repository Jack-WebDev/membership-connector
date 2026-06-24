import { env } from "@membership-connector-app/env/server";
import type { FastifyInstance } from "fastify";

import { createLulafiChatListener } from "../services/lulafi-chat/client";

export async function lulafiChatListenerPlugin(app: FastifyInstance) {
	if (!env.LULA_CHAT_ENABLED) {
		app.log.info("lulafi.chat.listener.disabled");
		return;
	}

	const listener = createLulafiChatListener();

	app.addHook("onReady", async () => {
		await listener.start();
	});

	app.addHook("onClose", async () => {
		await listener.stop();
	});
}
