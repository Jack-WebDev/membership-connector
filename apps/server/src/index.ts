import { env } from "@membership-connector-app/env/server";
import { buildServer } from "./app";
import { startLulafiChatIngestion } from "./lulafi/chat";

const start = async () => {
	const app = await buildServer();

	try {
		await app.listen({ port: env.PORT ?? 3000, host: "0.0.0.0" });
		await startLulafiChatIngestion(app);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
