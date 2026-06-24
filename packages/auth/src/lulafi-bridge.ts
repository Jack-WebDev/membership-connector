import { createHash, randomBytes } from "node:crypto";
import { env } from "@membership-connector-app/env/server";
import { getCookies, parseCookies } from "better-auth/cookies";
import { makeSignature } from "better-auth/crypto";
import { auth } from "./index";

const PROVIDER_ID = "lulafi";
const BRIDGE_ERROR_REDIRECT = "/auth/login?error=oauth_failed";
const DEFAULT_RETURN_TO = "/dashboard";
const TEMP_COOKIE_MAX_AGE_SECONDS = 60 * 10;
const TEMP_COOKIE_PREFIX = "lulafi_oauth";

const COOKIE_NAMES = {
	state: `${TEMP_COOKIE_PREFIX}_state`,
	verifier: `${TEMP_COOKIE_PREFIX}_verifier`,
	returnTo: `${TEMP_COOKIE_PREFIX}_return_to`,
} as const;

function buildAppRedirectUrl(path: string) {
	return new URL(path, env.CORS_ORIGIN).toString();
}

function logBridgeWarn(message: string, fields: Record<string, unknown>) {
	console.warn(`[lulafi-bridge] ${message}`, fields);
}

function logBridgeError(message: string, fields: Record<string, unknown>) {
	console.error(`[lulafi-bridge] ${message}`, fields);
}

type BridgeRedirectResponse = {
	redirectTo: string;
	setCookies: string[];
};

type LulafiDiscoveryDocument = {
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
};

type LulafiTokenResponse = {
	access_token: string;
	refresh_token?: string;
	id_token?: string;
	expires_in?: number;
	scope?: string;
	token_type?: string;
};

type LulafiUserInfo = {
	sub?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
};

let discoveryPromise: Promise<LulafiDiscoveryDocument> | null = null;

function isHttpsUrl(value: string) {
	return new URL(value).protocol === "https:";
}

function normalizeSameSite(
	value: "Strict" | "Lax" | "None" | "strict" | "lax" | "none" | undefined,
) {
	if (!value) {
		return "Lax";
	}

	switch (value.toLowerCase()) {
		case "strict":
			return "Strict";
		case "none":
			return "None";
		default:
			return "Lax";
	}
}

function safeDecodeURIComponent(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function serializeCookie(
	name: string,
	value: string,
	options: {
		maxAge?: number;
		path?: string;
		httpOnly?: boolean;
		secure?: boolean;
		sameSite?: "Strict" | "Lax" | "None" | "strict" | "lax" | "none";
		domain?: string;
		expires?: Date;
	},
) {
	const parts = [`${name}=${encodeURIComponent(value)}`];

	if (typeof options.maxAge === "number") {
		parts.push(`Max-Age=${options.maxAge}`);
	}

	if (options.domain) {
		parts.push(`Domain=${options.domain}`);
	}

	parts.push(`Path=${options.path ?? "/"}`);

	if (options.expires) {
		parts.push(`Expires=${options.expires.toUTCString()}`);
	}

	if (options.httpOnly !== false) {
		parts.push("HttpOnly");
	}

	if (options.secure) {
		parts.push("Secure");
	}

	parts.push(`SameSite=${normalizeSameSite(options.sameSite)}`);

	return parts.join("; ");
}

async function signCookieValue(value: string) {
	return `${value}.${await makeSignature(value, env.BETTER_AUTH_SECRET)}`;
}

async function verifySignedCookieValue(
	cookieHeader: string | undefined,
	cookieName: string,
) {
	if (!cookieHeader) {
		return null;
	}

	const value = parseCookies(cookieHeader).get(cookieName);
	if (!value) {
		return null;
	}

	const decodedValue = safeDecodeURIComponent(value);

	const separatorIndex = decodedValue.lastIndexOf(".");
	if (separatorIndex <= 0) {
		return null;
	}

	const unsignedValue = decodedValue.slice(0, separatorIndex);
	const signature = decodedValue.slice(separatorIndex + 1);
	const expectedSignature = await makeSignature(
		unsignedValue,
		env.BETTER_AUTH_SECRET,
	);

	return signature === expectedSignature ? unsignedValue : null;
}

function buildTempCookieOptions() {
	return {
		httpOnly: true,
		maxAge: TEMP_COOKIE_MAX_AGE_SECONDS,
		path: "/",
		sameSite: "Lax" as const,
		secure: isHttpsUrl(env.CORS_ORIGIN),
	};
}

function createTempCookie(name: string, value: string) {
	return signCookieValue(value).then((signedValue) =>
		serializeCookie(name, signedValue, buildTempCookieOptions()),
	);
}

function clearTempCookie(name: string) {
	return serializeCookie(name, "", {
		...buildTempCookieOptions(),
		maxAge: 0,
	});
}

function clearBridgeCookies() {
	return [
		clearTempCookie(COOKIE_NAMES.state),
		clearTempCookie(COOKIE_NAMES.verifier),
		clearTempCookie(COOKIE_NAMES.returnTo),
	];
}

function sanitizeReturnTo(value: string | null | undefined) {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return DEFAULT_RETURN_TO;
	}

	return value;
}

function buildRedirectUri() {
	return new URL("/auth/callback", env.CORS_ORIGIN).toString();
}

function buildDiscoveryUrl() {
	const issuerWithTrailingSlash = env.LULA_ISSUER.endsWith("/")
		? env.LULA_ISSUER
		: `${env.LULA_ISSUER}/`;

	return new URL(
		".well-known/openid-configuration",
		issuerWithTrailingSlash,
	).toString();
}

async function getDiscoveryDocument() {
	if (!discoveryPromise) {
		discoveryPromise = (async () => {
			const response = await fetch(buildDiscoveryUrl(), {
				headers: {
					accept: "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(
					`LulaFi discovery failed with status ${response.status}`,
				);
			}

			const document =
				(await response.json()) as Partial<LulafiDiscoveryDocument>;
			if (
				!document.authorization_endpoint ||
				!document.token_endpoint ||
				!document.userinfo_endpoint
			) {
				throw new Error(
					"LulaFi discovery response is missing required endpoints",
				);
			}

			return {
				authorization_endpoint: document.authorization_endpoint,
				token_endpoint: document.token_endpoint,
				userinfo_endpoint: document.userinfo_endpoint,
			};
		})().catch((error) => {
			discoveryPromise = null;
			throw error;
		});
	}

	return discoveryPromise;
}

function createRandomString(size = 32) {
	return randomBytes(size).toString("base64url");
}

function createPkceChallenge(verifier: string) {
	return createHash("sha256").update(verifier).digest("base64url");
}

function buildUserDisplayName(userInfo: LulafiUserInfo, email: string) {
	if (userInfo.name?.trim()) {
		return userInfo.name.trim();
	}

	const parts = [
		userInfo.given_name?.trim(),
		userInfo.family_name?.trim(),
	].filter(Boolean);
	if (parts.length > 0) {
		return parts.join(" ");
	}

	return email.split("@")[0] || "LulaFi User";
}

function buildSessionCookie(sessionToken: string) {
	const authCookies = getCookies(auth.options);
	const signedValuePromise = signCookieValue(sessionToken);

	return signedValuePromise.then((signedValue) =>
		serializeCookie(
			authCookies.sessionToken.name,
			signedValue,
			authCookies.sessionToken.attributes,
		),
	);
}

async function exchangeAuthorizationCode(
	code: string,
	codeVerifier: string,
	discovery: LulafiDiscoveryDocument,
) {
	const credentials = Buffer.from(
		`${env.LULA_CLIENT_ID}:${env.LULA_CLIENT_SECRET}`,
	).toString("base64");
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: buildRedirectUri(),
		code_verifier: codeVerifier,
	});

	const response = await fetch(discovery.token_endpoint, {
		method: "POST",
		headers: {
			accept: "application/json",
			authorization: `Basic ${credentials}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		body,
	});

	if (!response.ok) {
		throw new Error(
			`LulaFi token exchange failed with status ${response.status}`,
		);
	}

	const tokens = (await response.json()) as Partial<LulafiTokenResponse>;
	if (!tokens.access_token) {
		throw new Error("LulaFi token response is missing access_token");
	}

	return {
		access_token: tokens.access_token,
		refresh_token: tokens.refresh_token,
		id_token: tokens.id_token,
		expires_in: tokens.expires_in,
		scope: tokens.scope,
		token_type: tokens.token_type,
	} satisfies LulafiTokenResponse;
}

async function fetchUserInfo(
	accessToken: string,
	discovery: LulafiDiscoveryDocument,
) {
	const response = await fetch(discovery.userinfo_endpoint, {
		headers: {
			accept: "application/json",
			authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`LulaFi userinfo failed with status ${response.status}`);
	}

	return (await response.json()) as LulafiUserInfo;
}

async function resolveLocalUser(
	userInfo: LulafiUserInfo,
	tokens: LulafiTokenResponse,
) {
	const authContext = await auth.$context;

	if (!userInfo.sub) {
		throw new Error("LulaFi userinfo is missing subject");
	}

	const existingAccount =
		await authContext.internalAdapter.findAccountByProviderId(
			userInfo.sub,
			PROVIDER_ID,
		);
	if (existingAccount) {
		const existingUser = await authContext.internalAdapter.findUserById(
			existingAccount.userId,
		);
		if (!existingUser) {
			throw new Error("Linked LulaFi account has no local user");
		}

		await authContext.internalAdapter.updateAccount(existingAccount.id, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token,
			accessTokenExpiresAt: tokens.expires_in
				? new Date(Date.now() + tokens.expires_in * 1000)
				: null,
			scope: tokens.scope ?? null,
			updatedAt: new Date(),
		});

		if (userInfo.email_verified && !existingUser.emailVerified) {
			await authContext.internalAdapter.updateUser(existingUser.id, {
				emailVerified: true,
			});
		}

		return await authContext.internalAdapter.findUserById(existingUser.id);
	}

	const email = userInfo.email?.trim().toLowerCase();
	if (!email) {
		throw new Error("LulaFi userinfo is missing email");
	}

	let localUser = await authContext.internalAdapter.findUserByEmail(email, {
		includeAccounts: true,
	});

	if (localUser && !userInfo.email_verified) {
		throw new Error("Existing local user requires a verified LulaFi email");
	}

	if (!localUser) {
		const createdUser = await authContext.internalAdapter.createUser({
			name: buildUserDisplayName(userInfo, email),
			email,
			emailVerified: Boolean(userInfo.email_verified),
			image: userInfo.picture ?? null,
		});
		localUser = {
			user: createdUser,
			accounts: [],
		};
	}

	await authContext.internalAdapter.linkAccount({
		accountId: userInfo.sub,
		providerId: PROVIDER_ID,
		userId: localUser.user.id,
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		idToken: tokens.id_token,
		accessTokenExpiresAt: tokens.expires_in
			? new Date(Date.now() + tokens.expires_in * 1000)
			: null,
		scope: tokens.scope ?? null,
		password: null,
	});

	if (userInfo.email_verified && !localUser.user.emailVerified) {
		await authContext.internalAdapter.updateUser(localUser.user.id, {
			emailVerified: true,
		});
	}

	return await authContext.internalAdapter.findUserById(localUser.user.id);
}

export async function resolveOrCreateLulafiApplicant(input: {
	sub?: string;
	email: string;
	name: string;
}) {
	const authContext = await auth.$context;

	if (input.sub) {
		const existingAccount =
			await authContext.internalAdapter.findAccountByProviderId(
				input.sub,
				PROVIDER_ID,
			);
		if (existingAccount) {
			const existingUser = await authContext.internalAdapter.findUserById(
				existingAccount.userId,
			);
			if (existingUser) {
				return existingUser;
			}
		}
	}

	const email = input.email.trim().toLowerCase();
	let localUser = await authContext.internalAdapter.findUserByEmail(email, {
		includeAccounts: true,
	});

	if (!localUser) {
		const createdUser = await authContext.internalAdapter.createUser({
			name: input.name.trim() || email.split("@")[0] || "LulaFi Applicant",
			email,
			emailVerified: false,
			image: null,
		});
		localUser = { user: createdUser, accounts: [] };
	}

	if (input.sub) {
		const alreadyLinked = localUser.accounts.some(
			(account) =>
				account.providerId === PROVIDER_ID && account.accountId === input.sub,
		);
		if (!alreadyLinked) {
			await authContext.internalAdapter.linkAccount({
				accountId: input.sub,
				providerId: PROVIDER_ID,
				userId: localUser.user.id,
				accessToken: null,
				refreshToken: null,
				idToken: null,
				accessTokenExpiresAt: null,
				scope: null,
				password: null,
			});
		}
	}

	return localUser.user;
}

async function createBridgeSessionCookie(userId: string) {
	const authContext = await auth.$context;
	const session = await authContext.internalAdapter.createSession(userId);
	return buildSessionCookie(session.token);
}

function getCallbackFailureResponse() {
	return {
		redirectTo: buildAppRedirectUrl(BRIDGE_ERROR_REDIRECT),
		setCookies: clearBridgeCookies(),
	} satisfies BridgeRedirectResponse;
}

export async function beginLulafiOAuthFlow(
	returnToParam: string | undefined,
): Promise<BridgeRedirectResponse> {
	const discovery = await getDiscoveryDocument();
	const returnTo = sanitizeReturnTo(returnToParam);
	const state = createRandomString();
	const codeVerifier = createRandomString(48);
	const codeChallenge = createPkceChallenge(codeVerifier);
	const authorizationUrl = new URL(discovery.authorization_endpoint);

	authorizationUrl.searchParams.set("response_type", "code");
	authorizationUrl.searchParams.set("client_id", env.LULA_CLIENT_ID);
	authorizationUrl.searchParams.set("redirect_uri", buildRedirectUri());
	authorizationUrl.searchParams.set("scope", "openid profile email");
	authorizationUrl.searchParams.set("state", state);
	authorizationUrl.searchParams.set("code_challenge", codeChallenge);
	authorizationUrl.searchParams.set("code_challenge_method", "S256");

	return {
		redirectTo: authorizationUrl.toString(),
		setCookies: await Promise.all([
			createTempCookie(COOKIE_NAMES.state, state),
			createTempCookie(COOKIE_NAMES.verifier, codeVerifier),
			createTempCookie(COOKIE_NAMES.returnTo, returnTo),
		]),
	};
}

export async function completeLulafiOAuthFlow(input: {
	code: string | undefined;
	state: string | undefined;
	error: string | undefined;
	cookieHeader: string | undefined;
}) {
	if (input.error) {
		logBridgeWarn("lulafi.oauth.callback.provider_error", {
			errorCode: "LULAFI_PROVIDER_ERROR",
			provider: PROVIDER_ID,
			providerError: input.error,
		});
		return getCallbackFailureResponse();
	}

	if (!input.code || !input.state) {
		logBridgeWarn("lulafi.oauth.callback.missing_query", {
			errorCode: "LULAFI_CALLBACK_MISSING_QUERY",
			provider: PROVIDER_ID,
		});
		return getCallbackFailureResponse();
	}

	const [expectedState, codeVerifier, storedReturnTo] = await Promise.all([
		verifySignedCookieValue(input.cookieHeader, COOKIE_NAMES.state),
		verifySignedCookieValue(input.cookieHeader, COOKIE_NAMES.verifier),
		verifySignedCookieValue(input.cookieHeader, COOKIE_NAMES.returnTo),
	]);

	if (!expectedState || expectedState !== input.state || !codeVerifier) {
		logBridgeWarn("lulafi.oauth.callback.invalid_state", {
			errorCode: "LULAFI_CALLBACK_INVALID_STATE",
			provider: PROVIDER_ID,
		});
		return getCallbackFailureResponse();
	}

	try {
		const discovery = await getDiscoveryDocument();
		const tokens = await exchangeAuthorizationCode(
			input.code,
			codeVerifier,
			discovery,
		);
		const userInfo = await fetchUserInfo(tokens.access_token, discovery);
		const user = await resolveLocalUser(userInfo, tokens);

		if (!user) {
			throw new Error("Failed to resolve local user");
		}

		const sessionCookie = await createBridgeSessionCookie(user.id);

		return {
			redirectTo: buildAppRedirectUrl(sanitizeReturnTo(storedReturnTo)),
			setCookies: [...clearBridgeCookies(), sessionCookie],
		} satisfies BridgeRedirectResponse;
	} catch (error) {
		logBridgeError("lulafi.oauth.callback.failed", {
			err: error,
			errorCode: "LULAFI_CALLBACK_FAILED",
			provider: PROVIDER_ID,
		});
		return getCallbackFailureResponse();
	}
}
