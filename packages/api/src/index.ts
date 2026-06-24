import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error }) {
		if (error.cause instanceof ZodError) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of error.cause.issues) {
				const key = issue.path.join(".") || "_root";
				fieldErrors[key] ??= issue.message;
			}

			return {
				...shape,
				message: error.cause.issues.map((issue) => issue.message).join(" "),
				data: {
					...shape.data,
					errorType: "VALIDATION_ERROR" as const,
					fieldErrors,
				},
			};
		}

		return shape;
	},
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});
