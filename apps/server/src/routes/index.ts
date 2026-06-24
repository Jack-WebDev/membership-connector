import type { FastifyInstance } from "fastify";
import { accessRoutes } from "./access";
import { authRoutes } from "./auth";
import { healthRoutes } from "./health";
import { lulafiAuthRoutes } from "./lulafi-auth";

export async function registerRoutes(app: FastifyInstance) {
	await app.register(healthRoutes);
	await app.register(accessRoutes);
	await app.register(lulafiAuthRoutes);
	await app.register(authRoutes, { prefix: "/api/auth" });
}
