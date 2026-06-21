import type { AppRouter } from "@membership-connector-app/api/routers/index";
import { env } from "@membership-connector-app/env/web";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

// Plain client for public pages — no `headers()` call, so these routes
// can still be statically prerendered.
export const serverTrpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
		}),
	],
});

// Cookie-forwarding client for authenticated server components (org admin,
// member dashboard) where queries need the caller's session.
export const serverTrpcAuthed = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
			async headers() {
				const requestHeaders = await headers();
				const cookie = requestHeaders.get("cookie");
				return cookie ? { cookie } : {};
			},
		}),
	],
});
