import { env } from "@membership-connector-app/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
});

export function getLulafiAuthStartUrl(returnTo?: string) {
	const url = new URL("/api/lulafi/auth/start", env.NEXT_PUBLIC_SERVER_URL);

	if (returnTo) {
		url.searchParams.set("returnTo", returnTo);
	}

	return url.toString();
}
