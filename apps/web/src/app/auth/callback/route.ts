import { env } from "@membership-connector-app/env/web";
import { NextResponse } from "next/server";

export function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const callbackUrl = new URL(
		"/api/lulafi/auth/callback",
		env.NEXT_PUBLIC_SERVER_URL,
	);

	requestUrl.searchParams.forEach((value, key) => {
		callbackUrl.searchParams.append(key, value);
	});

	return NextResponse.redirect(callbackUrl);
}
