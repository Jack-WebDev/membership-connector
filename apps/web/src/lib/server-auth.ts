import "server-only";

import { env } from "@membership-connector-app/env/web";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type AccountRole = "member" | "organization" | "platform_admin";

type SessionSummary =
	| {
			authenticated: false;
	  }
	| {
			authenticated: true;
			session: {
				user: {
					id: string;
					name: string;
					email: string;
				};
			};
			roles: AccountRole[];
			canAccessLulafiInbox: boolean;
			redirectPath: string;
			organizationAccess: {
				organizationId: string;
				slug: string;
				name: string;
				role:
					| "owner"
					| "admin"
					| "membership_manager"
					| "finance_manager"
					| "content_manager"
					| "reviewer";
			} | null;
	  };

async function getSessionSummary(orgSlug?: string): Promise<SessionSummary> {
	const requestHeaders = await headers();
	const cookie = requestHeaders.get("cookie");
	const url = new URL(
		"/api/access/session-summary",
		env.NEXT_PUBLIC_SERVER_URL,
	);

	if (orgSlug) {
		url.searchParams.set("orgSlug", orgSlug);
	}

	const response = await fetch(url, {
		method: "GET",
		headers: cookie ? { cookie } : undefined,
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to resolve authenticated session state");
	}

	return response.json();
}

export async function getAuthenticatedRedirectPath(userId?: string) {
	const summary = await getSessionSummary();

	if (!summary.authenticated) {
		return "/auth/login" as Route;
	}

	if (userId && summary.session.user.id !== userId) {
		throw new Error(
			"Authenticated user mismatch while resolving redirect path",
		);
	}

	return summary.redirectPath as Route;
}

export async function redirectAuthenticatedUser() {
	const summary = await getSessionSummary();

	if (!summary.authenticated) {
		return;
	}

	redirect(summary.redirectPath as Route);
}

export async function requireSession(loginRedirectTo: string) {
	const summary = await getSessionSummary();

	if (!summary.authenticated) {
		redirect(
			`/auth/login?redirectTo=${encodeURIComponent(loginRedirectTo)}` as Route,
		);
	}

	return summary.session;
}

export async function getAuthState(): Promise<
	| { authenticated: false }
	| { authenticated: true; userId: string; roles: AccountRole[] }
> {
	const summary = await getSessionSummary();

	if (!summary.authenticated) {
		return { authenticated: false };
	}

	return {
		authenticated: true,
		userId: summary.session.user.id,
		roles: summary.roles,
	};
}

export async function getAccountRoles(userId?: string): Promise<AccountRole[]> {
	const summary = await getSessionSummary();

	if (!summary.authenticated) {
		return [];
	}

	if (userId && summary.session.user.id !== userId) {
		throw new Error(
			"Authenticated user mismatch while resolving account roles",
		);
	}

	return summary.roles;
}

export async function requireMemberSession(loginRedirectTo: string) {
	const session = await requireSession(loginRedirectTo);
	const roles = await getAccountRoles(session.user.id);

	if (!roles.includes("member")) {
		redirect(await getAuthenticatedRedirectPath(session.user.id));
	}

	return session;
}

export async function requireOrganizationSession(
	orgSlug: string,
	loginRedirectTo: string,
) {
	const summary = await getSessionSummary(orgSlug);

	if (!summary.authenticated) {
		redirect(
			`/auth/login?redirectTo=${encodeURIComponent(loginRedirectTo)}` as Route,
		);
	}

	if (!summary.organizationAccess) {
		redirect(summary.redirectPath as Route);
	}

	return {
		session: summary.session,
		organizationAccess: summary.organizationAccess,
	};
}

export async function requirePlatformAdminSession(loginRedirectTo: string) {
	const session = await requireSession(loginRedirectTo);
	const roles = await getAccountRoles(session.user.id);

	if (!roles.includes("platform_admin")) {
		redirect(await getAuthenticatedRedirectPath(session.user.id));
	}

	return session;
}

export async function requireLulafiSubmissionInboxSession(
	loginRedirectTo: string,
) {
	const summary = await getSessionSummary();

	if (!summary.authenticated) {
		redirect(
			`/auth/login?redirectTo=${encodeURIComponent(loginRedirectTo)}` as Route,
		);
	}

	if (!summary.canAccessLulafiInbox) {
		redirect(summary.redirectPath as Route);
	}

	return summary.session;
}
