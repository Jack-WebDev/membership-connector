import { TRPCError } from "@trpc/server";

export function notFoundError(message: string) {
	return new TRPCError({ code: "NOT_FOUND", message });
}

export function forbiddenError(message: string) {
	return new TRPCError({ code: "FORBIDDEN", message });
}

export function badRequestError(message: string) {
	return new TRPCError({ code: "BAD_REQUEST", message });
}

export function conflictError(message: string) {
	return new TRPCError({ code: "CONFLICT", message });
}
