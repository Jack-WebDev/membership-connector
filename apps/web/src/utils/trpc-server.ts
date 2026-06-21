import type { AppRouter } from "@membership-connector-app/api/routers/index";
import { env } from "@membership-connector-app/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const serverTrpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
		}),
	],
});
