import { describe, expect, it } from "vitest";

import { isLastActiveOwner } from "./last-owner";

function admin(
	overrides: Partial<{ id: string; role: string; status: string }>,
) {
	return {
		id: "owner-1",
		role: "owner",
		status: "active",
		...overrides,
	};
}

describe("isLastActiveOwner", () => {
	it("returns true when the target is the only active owner", () => {
		const admins = [admin({}), admin({ id: "admin-1", role: "admin" })];
		expect(isLastActiveOwner(admins, "owner-1")).toBe(true);
	});

	it("returns false when there is another active owner", () => {
		const admins = [admin({}), admin({ id: "owner-2" })];
		expect(isLastActiveOwner(admins, "owner-1")).toBe(false);
		expect(isLastActiveOwner(admins, "owner-2")).toBe(false);
	});

	it("returns false when the target is not an owner", () => {
		const admins = [admin({}), admin({ id: "admin-1", role: "admin" })];
		expect(isLastActiveOwner(admins, "admin-1")).toBe(false);
	});

	it("returns false when the target owner is not active", () => {
		const admins = [admin({ status: "invited" })];
		expect(isLastActiveOwner(admins, "owner-1")).toBe(false);
	});

	it("ignores removed owner rows when counting other owners", () => {
		const admins = [admin({}), admin({ id: "owner-2", status: "removed" })];
		expect(isLastActiveOwner(admins, "owner-1")).toBe(true);
	});

	it("returns false when no admin matches the id", () => {
		const admins = [admin({})];
		expect(isLastActiveOwner(admins, "missing")).toBe(false);
	});
});
